import { VideoRTC } from "./video-rtc.js";

export class VideoStream extends VideoRTC {
  constructor() {
    super();
    this.lastTime = 0;
    this.stuckCount = 0;
    this.MAX_STUCK_COUNT = 3; // Number of checks before refresh
    this.checkInterval = null;
  }

  set divMode(value) {
    // this.querySelector(".mode").innerText = value;
    // this.querySelector(".status").innerText = "";

    // Start monitoring when stream starts
    if (value !== "loading" && value !== "error") {
      this.startStreamCheck();
    }
  }

  set divError(value) {
    // const state = this.querySelector(".mode").innerText;
    // if (state !== "loading") return;
    // this.querySelector(".mode").innerText = "error";
    // this.querySelector(".status").innerText = value;
  }

  startStreamCheck() {
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.lastTime = this.video.currentTime;
    this.stuckCount = 0;

    // Check every 2 seconds
    this.checkInterval = setInterval(() => {
      if (!this.video.paused) {
        // Only check if video is playing
        const currentTime = this.video.currentTime;

        if (currentTime === this.lastTime) {
          this.stuckCount++;
          console.debug(
            `Stream stuck check: ${this.stuckCount}/${this.MAX_STUCK_COUNT}`
          );

          if (this.stuckCount >= this.MAX_STUCK_COUNT) {
            console.log("Stream appears stuck, refreshing...");
            this.refreshStream();
          }
        } else {
          this.stuckCount = 0;
        }

        this.lastTime = currentTime;
      }
    }, 2000);
  }

  refreshStream() {
    // Store current settings
    const currentMode = this.mode;
    const currentMedia = this.media;

    // Disconnect and cleanup
    this.ondisconnect();

    // Reset counters
    this.stuckCount = 0;
    this.lastTime = 0;

    // Clear check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Restore settings and reconnect
    this.mode = currentMode;
    this.media = currentMedia;

    // Reconnect after a short delay
    setTimeout(() => {
      if (this.wsURL) {
        this.src = this.wsURL;
      }
    }, 1000);
  }

  oninit() {
    console.debug("stream.oninit");
    super.oninit();

    this.innerHTML = `
        <style>
        video-stream {
            position: relative;
        }
        .info {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            padding: 12px;
            color: white;
            display: flex;
            justify-content: space-between;
            pointer-events: none;
        }
        </style>
        `;

    const info = this.querySelector(".info");
    this.insertBefore(this.video, info);

    // if (this.video) {
    //   this.video.controls = false;
    //   this.video.muted = true;
    //   this.video.style.maxWidth = "100%";
    //   this.video.style.objectFit = "fill";
    // }
  }

  onconnect() {
    console.debug("stream.onconnect");
    const result = super.onconnect();
    // if (result) this.divMode = "loading";
    return result;
  }

  ondisconnect() {
    console.debug("stream.ondisconnect");
    // Clear check interval on disconnect
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    super.ondisconnect();
  }

  onopen() {
    console.debug("stream.onopen");
    const result = super.onopen();

    this.onmessage["stream"] = (msg) => {
      console.debug("stream.onmessge", msg);
      switch (msg.type) {
        case "error":
          this.divError = msg.value;
          break;
        case "mse":
        case "hls":
        case "mp4":
        case "mjpeg":
          //   this.divMode = msg.type.toUpperCase();
          break;
      }
    };

    return result;
  }

  onclose() {
    console.debug("stream.onclose");
    return super.onclose();
  }

  onpcvideo(ev) {
    console.debug("stream.onpcvideo");
    super.onpcvideo(ev);

    if (this.pcState !== WebSocket.CLOSED) {
      //   this.divMode = "RTC";
    }
  }
}

customElements.define("video-stream", VideoStream);
