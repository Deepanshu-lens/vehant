import { VideoRTC } from "./video-rtc.js";

export class VideoStream extends VideoRTC {
  constructor() {
    super();
    this.lastTime = 0;
    this.stuckCount = 0;
    this.MAX_STUCK_COUNT = 3;
    this.checkInterval = null;
    this.playCheckInterval = null;
    this.lastCheck = Date.now();
    this.playAttempts = 0;
    this.MAX_PLAY_ATTEMPTS = 3;
    this.playTimeout = null;
  }

  set divMode(value) {
    if (value !== "loading" && value !== "error") {
      this.startStreamCheck();
    }
  }

  set divError(value) {}

  startStreamCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.lastTime = this.video.currentTime;
    this.stuckCount = 0;
    this.lastCheck = Date.now();

    this.checkInterval = setInterval(() => {
      const currentTime = this.video.currentTime;
      const now = Date.now();

      if (now - this.lastCheck >= 1900) {
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
        this.lastCheck = now;
      }
    }, 2000);
  }

  startPlaybackMonitor() {
    if (this.playCheckInterval) {
      clearInterval(this.playCheckInterval);
    }

    this.playCheckInterval = setInterval(() => {
      if (this.video && this.video.paused && this.video.readyState >= 2) {
        console.log("Playback paused, attempting to resume...");
        // Reset play attempts periodically to allow retry after temporary issues
        if (Date.now() - this.lastPlayAttempt > 5000) {
          this.playAttempts = 0;
        }
        this.playVideo();
      }
    }, 1000);
  }

  refreshStream() {
    const currentMode = this.mode;
    const currentMedia = this.media;

    this.ondisconnect();

    this.stuckCount = 0;
    this.lastTime = 0;
    this.playAttempts = 0;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.playCheckInterval) {
      clearInterval(this.playCheckInterval);
      this.playCheckInterval = null;
    }

    if (this.playTimeout) {
      clearTimeout(this.playTimeout);
      this.playTimeout = null;
    }

    this.mode = currentMode;
    this.media = currentMedia;

    setTimeout(() => {
      if (this.wsURL) {
        this.src = this.wsURL;
      }
    }, 1000);
  }

  lastPlayAttempt = 0;
  isPlayPending = false;

  async playVideo() {
    // Prevent multiple simultaneous play attempts
    if (this.isPlayPending) {
      console.log("Play already pending, skipping attempt");
      return;
    }

    // Check max attempts
    if (this.playAttempts >= this.MAX_PLAY_ATTEMPTS) {
      console.log("Max play attempts reached, refreshing stream");
      this.refreshStream();
      return;
    }

    // Debounce play attempts
    const now = Date.now();
    if (now - this.lastPlayAttempt < 1000) {
      console.log("Too soon to retry play, waiting...");
      return;
    }

    this.isPlayPending = true;
    this.lastPlayAttempt = now;
    this.playAttempts++;

    try {
      if (this.playTimeout) {
        clearTimeout(this.playTimeout);
      }

      this.video.muted = true;

      // Add a timeout to catch hanging play attempts
      const playPromise = this.video.play();
      this.playTimeout = setTimeout(() => {
        if (this.isPlayPending) {
          console.log("Play attempt timed out, retrying...");
          this.isPlayPending = false;
          this.playVideo();
        }
      }, 3000);

      await playPromise;
      clearTimeout(this.playTimeout);
      this.playTimeout = null;
      this.isPlayPending = false;
      this.playAttempts = 0; // Reset on successful play
      console.log("Playback started successfully");
    } catch (err) {
      clearTimeout(this.playTimeout);
      this.playTimeout = null;
      this.isPlayPending = false;

      console.warn("Play attempt failed:", err);

      if (err.name === "AbortError") {
        // Wait a bit longer before next attempt on abort
        setTimeout(() => {
          this.playVideo();
        }, 1500);
      } else if (this.playAttempts >= this.MAX_PLAY_ATTEMPTS) {
        console.log("Max play attempts reached after error, refreshing stream");
        this.refreshStream();
      }
    }
  }

  oninit() {
    super.oninit();

    this.style.display = "block";
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.backgroundColor = "#000";
    this.style.overflow = "hidden";
    this.style.position = "relative";

    if (this.video) {
      this.video.style = "";

      Object.assign(this.video.style, {
        display: "block",
        width: "100%",
        height: "100%",
        position: "absolute",
        top: "0",
        left: "0",
        objectFit: "contain",
        backgroundColor: "#000",
        margin: "0",
        padding: "0",
      });

      this.video.controls = false;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.setAttribute("playsinline", "");
      this.video.setAttribute("webkit-playsinline", "");

      let playStarted = false;

      this.video.addEventListener("loadedmetadata", () => {
        if (!playStarted) {
          playStarted = true;
          this.playVideo();
        }
      });

      this.video.addEventListener("canplay", () => {
        if (!playStarted) {
          playStarted = true;
          this.playVideo();
        }
      });

      this.startPlaybackMonitor();

      this.video.addEventListener("pause", () => {
        if (!this.isPlayPending) {
          console.log("Video paused, attempting to resume...");
          this.playVideo();
        }
      });

      this.video.addEventListener("playing", () => {
        playStarted = true;
        this.playAttempts = 0;
        console.log("Playback started");
      });
    }
  }

  onconnect() {
    console.debug("stream.onconnect");
    const result = super.onconnect();
    return result;
  }

  ondisconnect() {
    console.debug("stream.ondisconnect");
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.playCheckInterval) {
      clearInterval(this.playCheckInterval);
      this.playCheckInterval = null;
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
          break;
        case "mse":
        case "hls":
        case "mp4":
        case "mjpeg":
          if (this.video && this.video.paused) {
            this.playVideo();
          }
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

    if (this.pcState !== WebSocket.CLOSED && this.video && this.video.paused) {
      this.playVideo();
    }
  }
}

customElements.define("video-stream", VideoStream);
