<script lang="ts">
  import { onMount } from "svelte";

  export let url: string;
  export let classes: string;
  export let id: string;

  let videoElement: HTMLElement | null = null;
  let webSocketInstance: WebSocket | null = null;

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

    private readonly DISCONNECT_TIMEOUT: number = 5000;
    private readonly RECONNECT_TIMEOUT: number = 50000;
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
    }

    disconnectedCallback() {
      if (this.disconnectTID) return;
      if (this.wsState === WebSocket.CLOSED) return;

      this.disconnectTID = window.setTimeout(() => {
        this.disconnectTID = 0;
        this.ondisconnect();
      }, this.DISCONNECT_TIMEOUT);
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
      webSocketInstance = this.ws;
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

    handleVideoError() {
      console.error("Handling video element error...");

      if (this.ws) {
        this.ws.close();
      }

      if (this.retryCount >= this.maxRetries || this.reconnecting) {
        console.error("Max retries reached or already reconnecting.");
        return;
      }

      this.reconnecting = true;

      setTimeout(
        () => {
          this.ondisconnect();
          this.onconnect();
          this.reconnecting = false;
          this.retryCount++;
          console.log(
            `Reconnection attempt ${this.retryCount}/${this.maxRetries} ${this.wsURL}`
          );
        },
        Math.min(3000 * this.retryCount, 30000)
      );
    }

    onmse() {
      const MediaSource =
        window.MediaSource || (window as any).ManagedMediaSource;
      const ms = new MediaSource();

      const sourceOpenHandler = () => {
        if ("ManagedMediaSource" in window) {
          URL.revokeObjectURL(this.video.src);
        }
        this.send({
          type: "mse",
          value: this.codecs(MediaSource.isTypeSupported),
        });
      };

      ms.addEventListener("sourceopen", sourceOpenHandler, { once: true });

      if ("ManagedMediaSource" in window) {
        this.video.srcObject = ms;
      } else {
        this.video.src = URL.createObjectURL(ms);
      }

      this.video.addEventListener(
        "playing",
        () => {
          console.log("Video started playing in MSE mode");
          this.changeState("LOADED");
        },
        { once: true }
      );

      this.video.addEventListener("error", () => {
        if (this.wsState === WebSocket.OPEN) {
          console.error("Video element error:", this.video.error);
          this.handleVideoError();
        }
      });

      this.play();

      this.mseCodecs = "";

      this.onmessage["mse"] = (msg) => {
        if (msg.type !== "mse") return;

        this.mseCodecs = msg.value;

        const sb = ms.addSourceBuffer(msg.value);
        sb.mode = "segments";

        const buf = new Uint8Array(2 * 1024 * 1024);
        let bufLen = 0;

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
            }
          } catch (e) {
            console.error("Error in updateend:", e);
          }
        });

        this.ondata = (data) => {
          if (sb.updating || bufLen > 0) {
            const b = new Uint8Array(data);
            buf.set(b, bufLen);
            bufLen += b.byteLength;
          } else {
            try {
              sb.appendBuffer(data);
            } catch (e) {
              console.error("Error appending buffer:", e);
            }
          }
        };
      };
    }

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

    send(value: object) {
      if (this.ws) this.ws.send(JSON.stringify(value));
    }

    codecs(isSupported: (type: string) => boolean) {
      return this.CODECS.filter((codec) =>
        isSupported(`video/mp4; codecs="${codec}"`)
      ).join();
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
