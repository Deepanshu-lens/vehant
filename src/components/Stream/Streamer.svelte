<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let url: string;
  export let classes: string = "";
  export let id: string;

  let videoElement: HTMLElement | null = null;

  class VideoRTC extends HTMLElement {
    private video: HTMLVideoElement;
    private loadingState: HTMLDivElement;
    private ws: WebSocket | null = null;
    private wsURL: string = "";
    private wsState: number = WebSocket.CLOSED;
    private connectTS: number = 0;
    private mseCodecs: string = "";
    private ondata: ((data: ArrayBuffer) => void) | null = null;
    private onmessage: { [key: string]: (msg: any) => void } = {};
    private retryCount: number = 0;
    private maxRetries: number = 5;
    private reconnecting: boolean = false;
    private disconnectTID: number = 0;
    private reconnectTID: number = 0;
    private mediaSource: MediaSource | null = null;
    private sourceBuffers: SourceBuffer[] = [];
    private errorCount: number = 0;
    private bufferHealthCheckInterval: number | null = null;

    private readonly DISCONNECT_TIMEOUT: number = 5000;
    private readonly RECONNECT_TIMEOUT: number = 50000;
    private readonly MAX_SOURCE_BUFFERS = 1;
    private readonly MAX_ERROR_COUNT: number = 3;
    private readonly ERROR_RESET_TIMEOUT: number = 30000; // 30 seconds
    private readonly BUFFER_HEALTH_CHECK_INTERVAL = 1000; // ms
    private readonly BUFFER_THRESHOLD = 0.5; // seconds
    private readonly CODECS: string[] = [
      "avc1.640029",
      "avc1.64002A",
      "avc1.640033",
      "hvc1.1.6.L153.B0",
      "mp4a.40.2",
      "mp4a.40.5",
      "flac",
      "opus",
    ];

    constructor() {
      super();
      this.video = document.createElement("video");
      this.loadingState = document.createElement("div");
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    static get observedAttributes() {
      return ["data-url"];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      if (name === "data-url" && oldValue !== newValue) {
        this.wsURL = newValue;
        if (this.video) {
          this.ondisconnect();
        }
        this.onconnect();
      }
    }

    connectedCallback() {
      this.setupVideoElement();
      this.setupLoadingState();
      this.appendChild(this.loadingState);
      this.appendChild(this.video);
      this.changeState("LOADING");
      this.onconnect();
      this.startBufferHealthCheck();
      document.addEventListener(
        "visibilitychange",
        this.handleVisibilityChange
      );
    }

    disconnectedCallback() {
      if (this.disconnectTID) return;
      if (this.wsState === WebSocket.CLOSED) return;

      this.disconnectTID = window.setTimeout(() => {
        this.disconnectTID = 0;
        this.ondisconnect();
      }, this.DISCONNECT_TIMEOUT);

      this.stopBufferHealthCheck();
      document.removeEventListener(
        "visibilitychange",
        this.handleVisibilityChange
      );
    }

    setupVideoElement() {
      this.video.controls = false;
      this.video.autoplay = true;
      this.video.playsInline = true;
      this.video.preload = "auto";
      this.video.style.display = "block";
      this.video.style.width = "100%";
      this.video.style.height = "auto";
      this.video.className = "rounded-lg object-cover";
    }

    setupLoadingState() {
      this.loadingState.className =
        "absolute bg-primary/10 animate-pulse w-full h-full rounded-lg";
      this.loadingState.style.width = "100%";
      this.loadingState.style.height = "100%";
    }

    changeState(state: string) {
      if (!this.video || !this.loadingState) return;

      console.log("Change State to ", state);

      switch (state) {
        case "LOADING":
          this.loadingState.style.display = "block";
          this.video.style.display = "none";
          break;
        case "LOADED":
          this.loadingState.style.display = "none";
          this.video.style.display = "block";
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

    onconnect() {
      if (!this.isConnected || !this.wsURL || this.ws) return false;

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

      this.video.src = "";
      this.video.srcObject = null;
    }

    onopen() {
      this.wsState = WebSocket.OPEN;
      this.ws!.addEventListener("message", (ev) => {
        if (typeof ev.data === "string") {
          const msg = JSON.parse(ev.data);
          if (msg.value && msg.value.includes("No connection could be made")) {
            this.changeState("ERROR");
          }
          this.onmessage["mse"]?.(msg);
        } else {
          this.ondata?.(ev.data);
        }
      });

      this.ondata = null;
      this.onmessage = {};

      if ("MediaSource" in window || "ManagedMediaSource" in window) {
        this.onmse();
      }
    }

    onclose() {
      if (this.wsState === WebSocket.CLOSED) return false;

      this.wsState = WebSocket.CONNECTING;
      this.ws = null;

      const delay = Math.max(
        this.RECONNECT_TIMEOUT - (Date.now() - this.connectTS),
        0
      );

      this.reconnectTID = window.setTimeout(() => {
        this.reconnectTID = 0;
        this.onconnect();
      }, delay);

      return true;
    }

    async resumePlayback() {
      console.log("Attempting to resume playback");

      if (this.video.error) {
        console.error("Video element has an error:", this.video.error);
        await this.resetVideoElement();
      }

      if (this.video.paused) {
        try {
          await this.video.play();
          console.log("Playback resumed successfully");
        } catch (error) {
          console.error("Error resuming playback:", error);
          if (error.name === "NotAllowedError") {
            console.log("Autoplay prevented. Attempting to play muted.");
            this.video.muted = true;
            try {
              await this.video.play();
              console.log("Muted playback resumed successfully");
            } catch (mutedError) {
              console.error("Error resuming muted playback:", mutedError);
            }
          }
        }
      } else {
        console.log("Video is already playing");
      }

      if (this.wsState !== WebSocket.OPEN) {
        console.log("WebSocket is not open. Attempting to reconnect.");
        await this.reconnectWebSocket();
      } else {
        console.log("WebSocket is already open");
      }

      if (this.mediaSource && this.mediaSource.readyState === "open") {
        console.log("Checking and refilling buffer");
        this.checkAndRefillBuffer();
      } else {
        console.log(
          "MediaSource not ready for buffer refill. Attempting to recreate MSE."
        );
        await this.recreateMSE();
      }
    }

    async reconnectWebSocket() {
      console.log("Reconnecting WebSocket");
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before reconnecting
      return this.onconnect();
    }

    checkAndRefillBuffer() {
      if (!this.sourceBuffers[0] || this.sourceBuffers[0].updating) {
        console.log(
          "SourceBuffer not available or updating. Skipping buffer refill."
        );
        return;
      }

      const buffered = this.video.buffered;
      if (buffered.length > 0) {
        const currentTime = this.video.currentTime;
        const bufferEnd = buffered.end(buffered.length - 1);
        const bufferHealth = bufferEnd - currentTime;

        console.log(`Buffer health: ${bufferHealth.toFixed(2)} seconds`);

        if (bufferHealth < 5) {
          // If less than 5 seconds of buffer
          console.log("Buffer low. Requesting more data.");
          this.send({ type: "mse", value: "request_more_data" });
        } else {
          console.log("Buffer sufficient. No need to request more data.");
        }
      } else {
        console.log("No buffered data available.");
      }
    }

    handleVisibilityChange() {
      if (document.hidden) {
        console.log("Tab hidden. Pausing video.");
        this.video.pause();
      } else {
        console.log("Tab visible. Attempting to resume playback.");
        this.resumePlayback();
      }
    }

    async onmse() {
      const MediaSource =
        window.MediaSource || (window as any).ManagedMediaSource;
      this.mediaSource = new MediaSource();

      const sourceOpenPromise = new Promise<void>((resolve) => {
        const sourceOpenHandler = () => {
          console.log("MediaSource opened");
          this.mediaSource!.removeEventListener(
            "sourceopen",
            sourceOpenHandler
          );
          resolve();
        };
        this.mediaSource!.addEventListener("sourceopen", sourceOpenHandler);
      });

      this.video.src = URL.createObjectURL(this.mediaSource);

      await sourceOpenPromise;

      if (this.mseCodecs) {
        await this.addSourceBuffer(this.mseCodecs);
      } else {
        this.send({
          type: "mse",
          value: this.codecs(MediaSource.isTypeSupported),
        });
      }

      this.setupVideoEventListeners();

      this.onmessage["mse"] = async (msg) => {
        if (msg.type !== "mse") return;
        this.mseCodecs = msg.value;
        await this.addSourceBuffer(msg.value);
      };
    }

    setupVideoEventListeners() {
      this.video.addEventListener("playing", () => {
        console.log("Video started playing in MSE mode");
        this.changeState("LOADED");
      });

      this.video.addEventListener("pause", () => {
        console.log("Video paused");
      });

      this.video.addEventListener("waiting", () => {
        console.log("Video is waiting for more data");
        this.changeState("LOADING");
      });

      this.video.addEventListener("canplay", () => {
        console.log("Video can start playing");
        if (this.video.paused) {
          this.play();
        }
      });

      this.video.addEventListener("error", (e) => {
        console.error("Video error:", this.video.error);
        this.handleVideoError();
      });
    }

    async addSourceBuffer(mimeCodec: string) {
      console.log("Attempting to add SourceBuffer", mimeCodec);
      if (this.sourceBuffers.length >= this.MAX_SOURCE_BUFFERS) {
        console.log("Max SourceBuffers reached. Removing oldest SourceBuffer.");
        const oldestBuffer = this.sourceBuffers.shift();
        if (oldestBuffer) {
          this.mediaSource!.removeSourceBuffer(oldestBuffer);
        }
      }

      try {
        const sourceBuffer = this.mediaSource!.addSourceBuffer(mimeCodec);
        this.sourceBuffers.push(sourceBuffer);
        console.log("SourceBuffer added successfully");
        this.setupSourceBuffer(sourceBuffer);
      } catch (error) {
        console.error("Error adding SourceBuffer:", error);
        throw error; // Let the caller handle this error
      }
    }

    setupSourceBuffer(sourceBuffer: SourceBuffer) {
      sourceBuffer.mode = "segments";
      const buf = new Uint8Array(2 * 1024 * 1024);
      let bufLen = 0;

      sourceBuffer.addEventListener("updateend", () => {
        if (sourceBuffer.updating) return;

        try {
          if (bufLen > 0) {
            const data = buf.slice(0, bufLen);
            bufLen = 0;
            sourceBuffer.appendBuffer(data);
          } else if (sourceBuffer.buffered.length > 0) {
            const end =
              sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1) - 15;
            const start = sourceBuffer.buffered.start(0);
            if (end > start) {
              sourceBuffer.remove(start, end);
              this.mediaSource!.setLiveSeekableRange(end, end + 15);
            }
          }
        } catch (e) {
          console.error("Error in updateend:", e);
          this.handleSourceBufferError(e, sourceBuffer);
        }
      });

      this.ondata = (data) => {
        if (sourceBuffer.updating || bufLen > 0) {
          const b = new Uint8Array(data);
          buf.set(b, bufLen);
          bufLen += b.byteLength;
        } else {
          try {
            sourceBuffer.appendBuffer(data);
          } catch (e) {
            console.error("Error appending buffer:", e);
            this.handleSourceBufferError(e, sourceBuffer);
          }
        }
      };
    }

    handleSourceBufferError(error: any, sourceBuffer: SourceBuffer) {
      if (error.name === "QuotaExceededError") {
        this.handleQuotaExceeded(sourceBuffer);
      } else {
        console.error("Unhandled SourceBuffer error:", error);
        this.handleVideoError();
      }
    }

    handleQuotaExceeded(sourceBuffer: SourceBuffer) {
      console.log("Quota exceeded. Removing old data.");
      if (sourceBuffer.buffered.length > 0) {
        const currentTime = this.video.currentTime;
        const bufferEnd = sourceBuffer.buffered.end(
          sourceBuffer.buffered.length - 1
        );
        const removeEnd = Math.max(currentTime - 10, 0); // Keep 10

        if (removeEnd > 0 && removeEnd < bufferEnd) {
          sourceBuffer.remove(0, removeEnd);
        }
      }
    }

    async handleVideoError() {
      console.log("Handling video error");
      this.errorCount++;

      if (this.errorCount > this.MAX_ERROR_COUNT) {
        console.error("Max error count reached. Stopping recovery attempts.");
        this.changeState("ERROR");
        return;
      }

      if (this.video.error && this.video.error.code === 3) {
        // MEDIA_ERR_DECODE
        console.log("Decode error detected. Attempting to recover.");
        await this.handleDecodeError();
      } else {
        await this.resetVideoElement();
        this.play();
      }

      // Reset error count after some time
      setTimeout(() => {
        this.errorCount = 0;
      }, this.ERROR_RESET_TIMEOUT);
    }

    async handleDecodeError() {
      console.log("Handling decode error");
      await this.resetVideoElement();

      // Wait for a short time before attempting to play again
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.play();
    }

    async resetVideoElement() {
      console.log("Resetting video element");
      const oldVideo = this.video;
      this.video = document.createElement("video");
      this.video.controls = false;
      this.video.autoplay = true;
      this.video.playsInline = true;
      this.video.preload = "auto";
      this.video.style.display = "block";
      this.video.style.width = "100%";
      this.video.style.height = "auto";
      this.video.className = oldVideo.className;

      oldVideo.parentNode?.replaceChild(this.video, oldVideo);

      await this.recreateMSE();
    }

    async recreateMSE() {
      console.log("Recreating MSE");
      if (this.mediaSource) {
        if (this.mediaSource.readyState === "open") {
          this.mediaSource.endOfStream();
        }
        URL.revokeObjectURL(this.video.src);
      }
      this.sourceBuffers = [];
      await this.onmse();
    }

    play() {
      this.video.play().catch((error) => {
        console.error("Error playing video:", error);
        if (error.name === "NotAllowedError" && !this.video.muted) {
          console.log("Autoplay prevented. Attempting to play muted.");
          this.video.muted = true;
          this.video.play().catch((mutedError) => {
            console.error("Error playing muted video:", mutedError);
          });
        }
      });
    }

    send(value: object) {
      if (this.ws) this.ws.send(JSON.stringify(value));
    }

    codecs(isSupported: (type: string) => boolean) {
      return this.CODECS.filter((codec) =>
        isSupported(`video/mp4; codecs="${codec}"`)
      ).join();
    }

    startBufferHealthCheck() {
      this.bufferHealthCheckInterval = window.setInterval(() => {
        if (this.video.buffered.length > 0) {
          const bufferEnd = this.video.buffered.end(
            this.video.buffered.length - 1
          );
          const bufferHealth = bufferEnd - this.video.currentTime;

          if (bufferHealth < this.BUFFER_THRESHOLD) {
            this.dispatchEvent(
              new CustomEvent("buffering", {
                detail: { bufferHealth },
                bubbles: true,
                composed: true,
              })
            );
            this.changeState("LOADING");
          } else if (this.loadingState.style.display !== "none") {
            this.changeState("LOADED");
          }
        }
      }, this.BUFFER_HEALTH_CHECK_INTERVAL);
    }

    stopBufferHealthCheck() {
      if (this.bufferHealthCheckInterval !== null) {
        clearInterval(this.bufferHealthCheckInterval);
        this.bufferHealthCheckInterval = null;
      }
    }
  }

  onMount(() => {
    if (!customElements.get("lens-view-stream-tile")) {
      customElements.define("lens-view-stream-tile", VideoRTC);
    }
  });
</script>

<lens-view-stream-tile
  class="w-full h-full flex"
  data-url={url}
  id={`stream-${id}`}
></lens-view-stream-tile>
