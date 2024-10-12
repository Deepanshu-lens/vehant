<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  export let url: string;
  export let classes: string;

  let isVideoLoading = true;

  let videoElement: HTMLVideoElement | null = null;

  $: console.log("refereshed");

  class VideoRTC extends HTMLElement {
    constructor() {
      super();

      this.DISCONNECT_TIMEOUT = 5000;
      this.RECONNECT_TIMEOUT = 50000;

      this.CODECS = [
        "avc1.640029", // H.264 high 4.1 (Chromecast 1st and 2nd Gen)
        "avc1.64002A", // H.264 high 4.2 (Chromecast 3rd Gen)
        "avc1.640033", // H.264 high 5.1 (Chromecast with Google TV)
        "hvc1.1.6.L153.B0", // H.265 main 5.1 (Chromecast Ultra)
        "mp4a.40.2", // AAC LC
        "mp4a.40.5", // AAC HE
        "flac", // FLAC (PCM compatible)
        "opus", // OPUS Chrome, Firefox
      ];

      /**
       * [config] Supported modes (webrtc, webrtc/tcp, mse, hls, mp4, mjpeg).
       * @type {string}
       */
      this.mode = "mse";

      /**
       * [Config] Requested medias (video, audio, microphone).
       * @type {string}
       */
      this.media = "video,audio";

      /**
       * [config] Run stream when not displayed on the screen. Default `false`.
       * @type {boolean}
       */
      this.background = true;

      /**
       * [config] Run stream only when player in the viewport. Stop when user scroll out player.
       * Value is percentage of visibility from `0` (not visible) to `1` (full visible).
       * Default `0` - disable;
       * @type {number}
       */
      this.visibilityThreshold = 0;

      /**
       * [config] Run stream only when browser page on the screen. Stop when user change browser
       * tab or minimise browser windows.
       * @type {boolean}
       */
      this.visibilityCheck = true;

      /**
       * [config] WebRTC configuration
       * @type {RTCConfiguration}
       */
      this.pcConfig = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        sdpSemantics: "unified-plan", // important for Chromecast 1
      };

      /**
       * [info] WebSocket connection state. Values: CONNECTING, OPEN, CLOSED
       * @type {number}
       */
      this.wsState = WebSocket.CLOSED;

      /**
       * [info] WebRTC connection state.
       * @type {number}
       */
      this.pcState = WebSocket.CLOSED;

      /**
       * @type {HTMLVideoElement}
       */
      this.video = null;

      /**
       * @type {WebSocket}
       */
      this.ws = null;

      /**
       * @type {string|URL}
       */
      this.wsURL = this.getAttribute("data-url") || "";

      /**
       * @type {RTCPeerConnection}
       */
      this.pc = null;

      /**
       * @type {number}
       */
      this.connectTS = 0;

      /**
       * @type {string}
       */
      this.mseCodecs = "";

      /**
       * [internal] Disconnect TimeoutID.
       * @type {number}
       */
      this.disconnectTID = 0;

      /**
       * [internal] Reconnect TimeoutID.
       * @type {number}
       */
      this.reconnectTID = 0;

      /**
       * [internal] Handler for receiving Binary from WebSocket.
       * @type {Function}
       */
      this.ondata = null;

      /**
       * [internal] Handlers list for receiving JSON from WebSocket.
       * @type {Object.<string,Function>}
       */
      this.onmessage = null;
    }

    /**
     * Set video source (WebSocket URL). Support relative path.
     * @param {string|URL} value
     */
    set src(value) {
      if (typeof value !== "string") value = value.toString();
      if (value.startsWith("http")) {
        value = "ws" + value.substring(4);
      } else if (value.startsWith("/")) {
        value = "ws" + window.location.origin.substring(4) + value;
      }

      if (this.video) {
        console.log("value ", value, this.video);
        this.ondisconnect();
      }
      this.wsURL = value;
      this.onconnect();
    }

    /**
     * Play video. Support automute when autoplay blocked.
     * https://developer.chrome.com/blog/autoplay/
     */
    play() {
      this.video.play().catch(() => {
        if (!this.video.muted) {
          this.video.muted = true;
          this.video.play().catch((er) => {
            console.warn(er);
          });
        }
      });
    }

    /**
     * Send message to server via WebSocket
     * @param {Object} value
     */
    send(value) {
      if (this.ws) this.ws.send(JSON.stringify(value));
    }

    /** @param {Function} isSupported */
    codecs(isSupported) {
      return this.CODECS.filter(
        (codec) =>
          this.media.indexOf(codec.indexOf("vc1") > 0 ? "video" : "audio") >= 0
      )
        .filter((codec) => isSupported(`video/mp4; codecs="${codec}"`))
        .join();
    }

    changeState(state: string) {
      if (!this.video) return;
      if (!this.loadingState) return;

      console.log("Change State to ", state);

      switch (state) {
        case "LOADING":
          this.loadingState.style.display = "block";
          if (this.video) this.video.style.display = "none";
          break;
        case "LOADED":
          this.loadingState.style.display = "none";
          if (this.video) this.video.style.display = "block";
          break;
        case "ERROR":
          this.loadingState.style.display = "block";
          this.loadingState.className = this.loadingState.className.replace(
            "bg-gray-300",
            "bg-red-300"
          );
          break;
      }
    }

    /**
     * `CustomElement`. Invoked each time the custom element is appended into a
     * document-connected element.
     */
    connectedCallback() {
      if (this.disconnectTID) {
        clearTimeout(this.disconnectTID);
        this.disconnectTID = 0;
      }

      // because video autopause on disconnected from DOM
      if (this.video) {
        const seek = this.video.seekable;
        if (seek.length > 0) {
          this.video.currentTime = seek.end(seek.length - 1);
        }
        this.play();
      } else {
        this.oninit();
      }

      this.onconnect();
    }

    /**
     * `CustomElement`. Invoked each time the custom element is disconnected from the
     * document's DOM.
     */
    disconnectedCallback() {
      if (this.background || this.disconnectTID) return;
      if (
        this.wsState === WebSocket.CLOSED &&
        this.pcState === WebSocket.CLOSED
      )
        return;

      this.disconnectTID = setTimeout(() => {
        if (this.reconnectTID) {
          clearTimeout(this.reconnectTID);
          this.reconnectTID = 0;
        }

        this.disconnectTID = 0;

        this.ondisconnect();
      }, this.DISCONNECT_TIMEOUT);
    }

    /**
     * Creates child DOM elements. Called automatically once on `connectedCallback`.
     */
    oninit() {
      this.video = document.createElement("video");
      this.video.controls = false;
      this.video.autoplay = true;
      this.video.playsInline = true;
      this.video.preload = "auto";

      this.video.style.display = "block"; // fix bottom margin 4px
      this.video.style.width = "100%";
      this.video.style.height = "100%";
      this.video.className = "rounded-lg object-cover";

      this.loadingState = document.createElement("div");
      this.loadingState.className =
        "absolute bg-gray-300 animate-pulse w-full h-full rounded-lg";
      this.loadingState.style.width = "100%";
      this.loadingState.style.height = "100%";

      this.appendChild(this.loadingState);

      this.appendChild(this.video);

      this.changeState("LOADING");

      // all Safari lies about supported audio codecs
      const m = window.navigator.userAgent.match(/Version\/(\d+).+Safari/);
      if (m) {
        // AAC from v13, FLAC from v14, OPUS - unsupported
        const skip = m[1] < "13" ? "mp4a.40.2" : m[1] < "14" ? "flac" : "opus";
        this.CODECS.splice(this.CODECS.indexOf(skip));
      }

      if (this.background) return;

      if ("hidden" in document && this.visibilityCheck) {
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            this.disconnectedCallback();
          } else if (this.isConnected) {
            this.connectedCallback();
          }
        });
      }

      if ("IntersectionObserver" in window && this.visibilityThreshold) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) {
                this.disconnectedCallback();
              } else if (this.isConnected) {
                this.connectedCallback();
              }
            });
          },
          { threshold: this.visibilityThreshold }
        );
        observer.observe(this);
      }
    }

    /**
     * Connect to WebSocket. Called automatically on `connectedCallback`.
     * @return {boolean} true if the connection has started.
     */
    onconnect() {
      console.log(
        "onconnect",
        !this.isConnected,
        !this.wsURL,
        this.ws,
        this.pc
      );
      if (!this.isConnected || !this.wsURL || this.ws || this.pc) return false;

      // CLOSED or CONNECTING => CONNECTING
      this.wsState = WebSocket.CONNECTING;

      this.changeState("LOADING");

      this.connectTS = Date.now();

      this.ws = new WebSocket(this.wsURL);
      this.ws.binaryType = "arraybuffer";
      this.ws.addEventListener("open", () => this.onopen());
      this.ws.addEventListener("close", () => this.onclose());

      return true;
    }

    ondisconnect() {
      this.wsState = WebSocket.CLOSED;
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      this.pcState = WebSocket.CLOSED;
      if (this.pc) {
        this.pc.getSenders().forEach((sender) => {
          if (sender.track) sender.track.stop();
        });
        this.pc.close();
        this.pc = null;
      }

      this.video.src = "";
      this.video.srcObject = null;
    }

    /**
     * @returns {Array.<string>} of modes (mse, webrtc, etc.)
     */
    onopen() {
      // CONNECTING => OPEN
      this.wsState = WebSocket.OPEN;
      console.log("Connecting", this.wsURL);
      this.ws.addEventListener("message", (ev) => {
        if (typeof ev.data === "string") {
          const msg = JSON.parse(ev.data);
          if (msg.value && msg.value.includes("No connection could be made")) {
            console.log("connection error", this.wsURL);
            let camName = this.wsURL.split("&cn=")[1];
            this.changeState("ERROR");
          }
          for (const mode in this.onmessage) {
            this.onmessage[mode](msg);
          }
        } else {
          this.ondata(ev.data);
        }
      });

      this.ondata = null;
      this.onmessage = {};

      const modes = [];

      if (
        this.mode.indexOf("mse") >= 0 &&
        ("MediaSource" in window || "ManagedMediaSource" in window)
      ) {
        modes.push("mse");
        this.onmse();
      }

      if (this.mode.indexOf("webrtc") >= 0 && "RTCPeerConnection" in window) {
        modes.push("webrtc");
        this.onwebrtc();
      }

      return modes;
    }

    /**
     * @return {boolean} true if reconnection has started.
     */
    onclose() {
      if (this.wsState === WebSocket.CLOSED) return false;

      // CONNECTING, OPEN => CONNECTING
      this.wsState = WebSocket.CONNECTING;
      this.ws = null;

      // reconnect no more than once every X seconds
      const delay = Math.max(
        this.RECONNECT_TIMEOUT - (Date.now() - this.connectTS),
        0
      );

      this.reconnectTID = setTimeout(() => {
        this.reconnectTID = 0;
        this.onconnect();
      }, delay);

      return true;
    }

    onmse() {
      /** @type {MediaSource} */
      let ms;
      console.log("here");
      if ("ManagedMediaSource" in window) {
        const MediaSource = window.ManagedMediaSource;

        ms = new MediaSource();
        ms.addEventListener(
          "sourceopen",
          () => {
            this.send({
              type: "mse",
              value: this.codecs(MediaSource.isTypeSupported),
            });
          },
          { once: true }
        );

        this.video.disableRemotePlayback = true;
        this.video.srcObject = ms;
      } else {
        ms = new MediaSource(this.codecs(MediaSource.isTypeSupported));
        // console.log("milgya   ", URL.revokeObjectURL(this.video.src))
        ms.addEventListener(
          "sourceopen",
          () => {
            URL.revokeObjectURL(this.video.src);
            this.send({
              type: "mse",
              value: this.codecs(MediaSource.isTypeSupported),
            });
          },
          { once: true }
        );

        this.video.src = URL.createObjectURL(ms);
        this.video.srcObject = null;
      }

      this.video.addEventListener(
        "playing",
        () => {
          console.log("Video started playing in MSE mode");
          this.changeState("LOADED");
        },
        { once: true }
      );

      this.play();

      this.mseCodecs = "";

      this.onmessage["mse"] = (msg) => {
        if (msg.type !== "mse") return;

        this.mseCodecs = msg.value;

        const sb = ms.addSourceBuffer(msg.value);
        sb.mode = "segments"; // segments or sequence

        sb.addEventListener("updateend", () => {
          if (sb.updating) return;

          try {
            if (bufLen > 0) {
              const data = buf.slice(0, bufLen);
              bufLen = 0;
              sb.appendBuffer(data);
            } else if (sb.buffered && sb.buffered.length) {
              const end = sb.buffered.end(sb.buffered.length - 1) - 15;
              const start = sb.buffered.start(0);
              if (end > start) {
                sb.remove(start, end);
                ms.setLiveSeekableRange(end, end + 15);
              }
              // console.debug("VideoRTC.buffered", start, end);
            }
          } catch (e) {
            // console.debug(e);
          }
        });

        const buf = new Uint8Array(2 * 1024 * 1024);
        let bufLen = 0;

        this.ondata = (data) => {
          if (sb.updating || bufLen > 0) {
            const b = new Uint8Array(data);
            buf.set(b, bufLen);
            bufLen += b.byteLength;
            // console.debug("VideoRTC.buffer", b.byteLength, bufLen);
          } else {
            try {
              sb.appendBuffer(data);
            } catch (e) {
              // console.debug(e);
            }
          }
        };
      };
    }

    onwebrtc() {
      const pc = new RTCPeerConnection(this.pcConfig);

      pc.addEventListener("icecandidate", (ev) => {
        if (
          ev.candidate &&
          this.mode.indexOf("webrtc/tcp") >= 0 &&
          ev.candidate.protocol === "udp"
        )
          return;

        const candidate = ev.candidate ? ev.candidate.toJSON().candidate : "";
        this.send({ type: "webrtc/candidate", value: candidate });
      });

      pc.addEventListener("connectionstatechange", () => {
        if (pc.connectionState === "connected") {
          const tracks = pc.getReceivers().map((receiver) => receiver.track);
          /** @type {HTMLVideoElement} */
          const video2 = document.createElement("video");
          video2.addEventListener("loadeddata", () => this.onpcvideo(video2), {
            once: true,
          });
          video2.srcObject = new MediaStream(tracks);
        } else if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          pc.close(); // stop next events

          this.pcState = WebSocket.CLOSED;
          this.pc = null;

          this.onconnect();
        }
      });

      this.onmessage["webrtc"] = (msg) => {
        switch (msg.type) {
          case "webrtc/candidate":
            if (
              this.mode.indexOf("webrtc/tcp") >= 0 &&
              msg.value.indexOf(" udp ") > 0
            )
              return;

            pc.addIceCandidate({ candidate: msg.value, sdpMid: "0" }).catch(
              (er) => {
                console.warn(er);
              }
            );
            break;
          case "webrtc/answer":
            pc.setRemoteDescription({ type: "answer", sdp: msg.value }).catch(
              (er) => {
                console.warn(er);
              }
            );
            break;
          case "error":
            this.changeState("ERROR");
            if (msg.value.indexOf("webrtc/offer") < 0) return;
            pc.close();
        }
      };

      this.createOffer(pc).then((offer) => {
        this.send({ type: "webrtc/offer", value: offer.sdp });
      });

      this.pcState = WebSocket.CONNECTING;
      this.pc = pc;
    }

    /**
     * @param pc {RTCPeerConnection}
     * @return {Promise<RTCSessionDescriptionInit>}
     */
    async createOffer(pc) {
      try {
        if (this.media.indexOf("microphone") >= 0) {
          const media = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          media.getTracks().forEach((track) => {
            pc.addTransceiver(track, { direction: "sendonly" });
          });
        }
      } catch (e) {
        console.warn(e);
      }

      for (const kind of ["video", "audio"]) {
        if (this.media.indexOf(kind) >= 0) {
          pc.addTransceiver(kind, { direction: "recvonly" });
        }
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      return offer;
    }

    /**
     * @param video2 {HTMLVideoElement}
     */
    onpcvideo(video2) {
      if (this.pc) {
        // Video+Audio > Video, H265 > H264, Video > Audio, WebRTC > MSE
        let rtcPriority = 0,
          msePriority = 0;

        /** @type {MediaStream} */
        const stream = video2.srcObject;
        if (stream.getVideoTracks().length > 0) rtcPriority += 0x220;
        if (stream.getAudioTracks().length > 0) rtcPriority += 0x102;

        if (this.mseCodecs.indexOf("hvc1.") >= 0) msePriority += 0x230;
        if (this.mseCodecs.indexOf("avc1.") >= 0) msePriority += 0x210;
        if (this.mseCodecs.indexOf("mp4a.") >= 0) msePriority += 0x101;

        if (rtcPriority >= msePriority) {
          this.video.srcObject = stream;
          this.play();

          this.pcState = WebSocket.OPEN;

          this.wsState = WebSocket.CLOSED;
          if (this.ws) {
            this.ws.close();
            this.ws = null;
          }
        } else {
          this.pcState = WebSocket.CLOSED;
          if (this.pc) {
            this.pc.close();
            this.pc = null;
          }
        }
      }

      video2.srcObject = null;
    }

    onmp4() {
      /** @type {HTMLCanvasElement} **/
      const canvas = document.createElement("canvas");
      /** @type {CanvasRenderingContext2D} */
      let context;

      /** @type {HTMLVideoElement} */
      const video2 = document.createElement("video");
      video2.autoplay = true;
      video2.playsInline = true;
      video2.muted = true;

      video2.addEventListener("loadeddata", () => {
        if (!context) {
          canvas.width = video2.videoWidth;
          canvas.height = video2.videoHeight;
          context = canvas.getContext("2d");
        }

        context.drawImage(video2, 0, 0, canvas.width, canvas.height);

        this.video.controls = false;
        this.video.poster = canvas.toDataURL("image/jpeg");
      });

      this.ondata = (data) => {
        video2.src = "data:video/mp4;base64," + VideoRTC.btoa(data);
      };

      this.send({ type: "mp4", value: this.codecs(this.video.canPlayType) });
    }

    static btoa(buffer) {
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      let binary = "";
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    }
  }

  // class VideoStreamLib extends HTMLElement {
  //   // WebSocket connection to the video stream
  //   ws: WebSocket | null = null;

  //   loadingState: HTMLDivElement | null = null;

  //   // Video element to display the stream
  //   video: HTMLVideoElement | null = null;

  //   // WebSocket URL for the video stream
  //   wsURL: string | null | undefined = "";

  //   // WebRTC Peer Connection
  //   pc: RTCPeerConnection | null = null;

  //   // WebSocket connection state
  //   wsState: number = WebSocket.CLOSED;

  //   // WebRTC Peer Connection state
  //   pcState: number = WebSocket.CLOSED;

  //   // Timeout durations for disconnect and reconnect
  //   DISCONNECT_TIMEOUT: number = 5000;
  //   RECONNECT_TIMEOUT: number = 50000;

  //   // Indicates whether to run the stream in the background
  //   background: boolean = true;

  //   // Threshold for stream visibility
  //   visibilityThreshold: number = 0;

  //   // Checks if the stream should be visible
  //   visibilityCheck: boolean = false;

  //   // WebRTC configuration
  //   pcConfig: RTCConfiguration = {
  //     iceServers: [{ urls: "stun:3.145.176.80:3478" }],
  //     bundlePolicy: "balanced",
  //     rtcpMuxPolicy: "require",
  //   };

  //   // WebSocket connection timestamp
  //   connectTS: number = 0;

  //   // Disconnect and reconnect timeout IDs
  //   disconnectTID: number = 5000;
  //   reconnectTID: number = 50000;

  //   // Handlers for WebSocket messages and data
  //   ondata: ((data: ArrayBuffer) => void) | null = null;
  //   onmessage: { [key: string]: (msg: any) => void } = {};

  //   constructor() {
  //     super();
  //   }

  //   changeState(state: string) {
  //     if (!this.video) return;
  //     if (!this.loadingState) return;

  //     switch (state) {
  //       case "LOADING":
  //         this.loadingState.style.display = "block";
  //         if (this.video) this.video.style.display = "none";
  //         break;
  //       case "LOADED":
  //         this.loadingState.style.display = "none";
  //         if (this.video) this.video.style.display = "block";
  //         break;
  //       case "ERROR":
  //         this.loadingState.style.display = "block";
  //         this.loadingState.className = this.loadingState.className.replace(
  //           "bg-gray-300",
  //           "bg-red-300"
  //         );
  //         break;
  //     }
  //   }

  //   connectedCallback() {
  //     this.wsURL = this.getAttribute("data-url");

  //     if (this.disconnectTID) {
  //       clearTimeout(this.disconnectTID);
  //       this.disconnectTID = 0;
  //     }

  //     this.oninit();
  //     this.onconnect();
  //   }

  //   disconnectedCallback() {
  //     if (this.background || this.disconnectTID) return;

  //     if (
  //       this.wsState === WebSocket.CLOSED &&
  //       this.pcState === WebSocket.CLOSED
  //     )
  //       return;

  //     this.disconnectTID = window.setTimeout(() => {
  //       if (this.reconnectTID) {
  //         clearTimeout(this.reconnectTID);
  //         this.reconnectTID = 0;
  //       }

  //       this.disconnectTID = 0;

  //       this.ondisconnect();
  //     }, this.DISCONNECT_TIMEOUT);
  //   }

  //   oninit() {
  //     this.video = document.createElement("video");
  //     this.video.controls = false;
  //     this.video.playsInline = true;
  //     this.video.preload = "auto";

  //     this.video.style.display = "block";
  //     this.video.className = "rounded-lg";

  //     this.loadingState = document.createElement("div");
  //     this.loadingState.className =
  //       "absolute bg-gray-300 animate-pulse w-full h-full rounded-lg";
  //     this.loadingState.style.width = "100%";
  //     this.loadingState.style.height = "100%";

  //     this.appendChild(this.loadingState);
  //     this.appendChild(this.video);

  //     if (this.background) return;

  //     if ("hidden" in document && this.visibilityCheck) {
  //       document.addEventListener("visibilitychange", () => {
  //         if (document.hidden) {
  //           this.disconnectedCallback();
  //         } else if (this.isConnected) {
  //           this.connectedCallback();
  //         }
  //       });
  //     }

  //     if ("IntersectionObserver" in window && this.visibilityThreshold) {
  //       const observer = new IntersectionObserver(
  //         (entries) => {
  //           entries.forEach((entry) => {
  //             if (!entry.isIntersecting) {
  //               this.disconnectedCallback();
  //             } else if (this.isConnected) {
  //               this.connectedCallback();
  //             }
  //           });
  //         },
  //         { threshold: this.visibilityThreshold }
  //       );
  //       observer.observe(this);
  //     }
  //   }

  //   onconnect() {
  //     if (!this.isConnected || !this.wsURL || this.ws || this.pc) return false;

  //     this.wsState = WebSocket.CONNECTING;
  //     this.connectTS = Date.now();

  //     this.ws = new WebSocket(this.wsURL);

  //     this.ws.binaryType = "arraybuffer";
  //     this.ws.addEventListener("open", () => this.onopen());
  //     this.ws.addEventListener("close", () => this.onclose());

  //     console.log("WebSocket Connected");
  //     return true;
  //   }

  //   onopen() {
  //     console.log("WebSocket Opened");
  //     this.wsState = WebSocket.OPEN;

  //     this.ws &&
  //       this.ws.addEventListener("message", (ev) => {
  //         if (typeof ev.data === "string") {
  //           const msg = JSON.parse(ev.data);
  //           if (msg.value) {
  //           }
  //           for (const mode in this.onmessage) {
  //             this.onmessage[mode] && this.onmessage[mode](msg);
  //           }
  //         } else {
  //           this.ondata && this.ondata(ev.data);
  //         }
  //       });

  //     this.ondata = null;
  //     this.onmessage = {};

  //     const modes: string[] = [];

  //     if ("RTCPeerConnection" in window) {
  //       modes.push("webrtc");
  //       this.onwebrtc();
  //     }

  //     return modes;
  //   }

  //   // @ts-expect-error
  //   override onclose() {
  //     console.log("WebSocket Closed");
  //     if (this.wsState === WebSocket.CLOSED) return false;

  //     this.wsState = WebSocket.CONNECTING;
  //     this.ws = null;

  //     const delay = Math.max(
  //       this.RECONNECT_TIMEOUT - (Date.now() - this.connectTS),
  //       0
  //     );

  //     this.reconnectTID = window.setTimeout(() => {
  //       this.reconnectTID = 0;
  //       this.onconnect();
  //     }, delay);

  //     return true;
  //   }

  //   ondisconnect() {
  //     this.wsState = WebSocket.CLOSED;
  //     if (this.ws) {
  //       this.ws.close();
  //       this.ws = null;
  //     }

  //     this.pcState = WebSocket.CLOSED;
  //     if (this.pc) {
  //       this.pc.getSenders().forEach((sender) => {
  //         if (sender.track) sender.track.stop();
  //       });
  //       this.pc.close();
  //       this.pc = null;
  //     }

  //     if (this.video) this.video.src = "";
  //     if (this.video) this.video.srcObject = null;
  //   }

  //   send(value: any) {
  //     if (this.ws) this.ws.send(JSON.stringify(value));
  //   }

  //   onwebrtc() {
  //     const pc = new RTCPeerConnection(this.pcConfig);
  //     console.log("WebSocket RTCPeerConnection Created");
  //     pc.addEventListener("icecandidate", (ev) => {
  //       console.log("ICE Candidate", ev.candidate);
  //       // if (ev.candidate && ev.candidate.protocol === "udp") {
  //       //     console.error(
  //       //         "WRONG CANIDADATE OR PROTOCOL",
  //       //         ev.candidate,
  //       //         ev.candidate.protocol,
  //       //         ev.candidate.protocol === "udp",
  //       //     );
  //       //     return;
  //       // }

  //       // console.log(" I AM HERE", ev.candidate, ev.candidate?.toJSON());

  //       const candidate = ev.candidate ? ev.candidate.toJSON().candidate : "";

  //       this.send({ type: "webrtc/candidate", value: candidate });
  //     });

  //     pc.addEventListener("connectionstatechange", () => {
  //       if (pc.connectionState === "connected") {
  //         console.log("WebRTC Connected");
  //         const tracks = pc.getReceivers().map((receiver) => receiver.track);

  //         /** @type {HTMLVideoElement} */
  //         const video2 = document.createElement("video");
  //         video2.addEventListener("loadeddata", () => this.onpcvideo(video2), {
  //           once: true,
  //         });
  //         video2.srcObject = new MediaStream(tracks);
  //       } else if (
  //         pc.connectionState === "failed" ||
  //         pc.connectionState === "disconnected"
  //       ) {
  //         console.log("WebRTC Closed");
  //         pc.close(); // stop next events

  //         this.pcState = WebSocket.CLOSED;
  //         this.pc = null;

  //         this.changeState("ERROR");

  //         this.onconnect();
  //       }
  //     });

  //     this.onmessage["webrtc"] = (msg) => {
  //       switch (msg.type) {
  //         case "webrtc/candidate":
  //           // const candidateText = `candidate:${msg.value.CandidateID} 1 udp ${msg.value.Priority} ${msg.value.IPAddress} ${msg.value.Port} typ srflx raddr 0.0.0.0 rport ${msg.value.Port}`;

  //           pc.addIceCandidate({
  //             // candidate: candidateText,
  //             candidate: msg.value,
  //             sdpMid: "0",
  //           }).catch((er) => {
  //             console.warn(er);
  //           });
  //           break;
  //         case "webrtc/answer":
  //           // const sdpTemplate = `v=0\r\no=- ${msg.value.session_ids[0][0]} ${msg.value.session_ids[0][1]} IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=msid-semantic:WMS*\r\na=fingerprint:sha-256 ${msg.value.fingerprint[0][0]}\r\na=extmap-allow-mixed\r\na=group:BUNDLE 0\r\nm=video 9 UDP/TLS/RTP/SAVPF 102 106 112\r\nc=IN IP4 0.0.0.0\r\na=setup:active\r\na=mid:0\r\na=ice-ufrag:${msg.value.ice_ufrag[0]}\r\na=ice-pwd:${msg.value.ice_pwd[0]}\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:102 H264/90000\r\na=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\na=rtcp-fb:102 goog-remb \r\na=rtcp-fb:102 transport-cc \r\na=rtcp-fb:102 ccm fir\r\na=rtcp-fb:102 nack \r\na=rtcp-fb:102 nack pli\r\na=rtpmap:106 H264/90000\r\na=fmtp:106 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtcp-fb:106 goog-remb \r\na=rtcp-fb:106 transport-cc \r\na=rtcp-fb:106 ccm fir\r\na=rtcp-fb:106 nack \r\na=rtcp-fb:106 nack pli\r\na=rtpmap:112 H264/90000\r\na=fmtp:112 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f\r\na=rtcp-fb:112 goog-remb \r\na=rtcp-fb:112 transport-cc \r\na=rtcp-fb:112 ccm fir\r\na=rtcp-fb:112 nack \r\na=rtcp-fb:112 nack pli\r\na=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=ssrc:${msg.value.ssrc[0]} cname:go2rtc\r\na=ssrc:${msg.value.ssrc[0]} msid:go2rtc go2rtc-video\r\na=ssrc:${msg.value.ssrc[0]} mslabel:go2rtc\r\na=ssrc:${msg.value.ssrc[0]} label:go2rtc-video\r\na=msid:go2rtc go2rtc-video\r\na=sendonly\r\n`;
  //           pc.setRemoteDescription({
  //             type: "answer",
  //             sdp: msg.value,
  //           }).catch((er) => {
  //             console.warn(er);
  //           });

  //           break;
  //         case "error":
  //           if (msg.value.indexOf("webrtc/offer") < 0) return;
  //           pc.close();
  //           this.changeState("ERROR");
  //       }
  //     };

  //     this.createOffer(pc).then((offer) => {
  //       // var results: { [key: string]: string[] } = {};
  //       // const regexPatterns = {
  //       //     session_ids: /o=- (\d+) (\d+) IN IP4/,
  //       //     fingerprint: /fingerprint:sha-256 ([A-F0-9:]+)/,
  //       //     ice_ufrag: /ice-ufrag:(\S+)/,
  //       //     ice_pwd: /ice-pwd:(\S+)/,
  //       //     ssrc: /ssrc:(\d+)/,
  //       // };
  //       // for (const key in regexPatterns) {
  //       //     const regex =
  //       //         regexPatterns[key as keyof typeof regexPatterns];
  //       //     const match = offer.sdp.match(regex);
  //       //     if (match) {
  //       //         results[key] = match.slice(1); // Capture groups
  //       //     }
  //       // }
  //       this.send({
  //         type: "webrtc/offer",
  //         value: offer.sdp,
  //       });
  //     });

  //     this.pcState = WebSocket.CONNECTING;
  //     this.pc = pc;
  //   }

  //   /**
  //    * @param pc {RTCPeerConnection}
  //    * @return {Promise<RTCSessionDescriptionInit>}
  //    */
  //   async createOffer(pc: any) {
  //     pc.addTransceiver("video", { direction: "recvonly" });
  //     const offer = await pc.createOffer();
  //     await pc.setLocalDescription(offer);
  //     return offer;
  //   }

  //   /**
  //    * @param video2 {HTMLVideoElement}
  //    */
  //   onpcvideo(video2: any) {
  //     if (this.pc && this.video) {
  //       /** @type {MediaStream} */
  //       const stream = video2.srcObject;
  //       this.video.srcObject = stream;
  //       this.changeState("LOADED");
  //       this.video.play().catch(() => {
  //         if (this.video && !this.video.muted) {
  //           this.video.muted = true;
  //           this.video.play().catch((er) => {
  //             console.warn(er);
  //           });
  //         }
  //       });

  //       this.pcState = WebSocket.OPEN;

  //       this.wsState = WebSocket.CLOSED;
  //       if (this.ws) {
  //         this.ws.close();
  //         this.ws = null;
  //       }
  //     }

  //     video2.srcObject = null;
  //   }
  // }

  onMount(() => {
    if (!customElements.get("lens-view-stream-tile")) {
      customElements.define("lens-view-stream-tile", VideoRTC);
    }
  });
</script>

<lens-view-stream-tile
  bind:this={videoElement}
  class="w-full h-full"
  data-url={url}
></lens-view-stream-tile>

<!-- <div class={`bg-rose-200 ${classes}`} style="aspect-ratio: 16/9;"></div> -->
