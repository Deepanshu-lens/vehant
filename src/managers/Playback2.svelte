<script>
  import { onMount } from "svelte";

  let video;
  let ws;
  let sourceBuffer;
  let mediaSource;
  let isActive = false;
  let segments = [];
  let isFirstSegment = true;

  // The WebSocket URL
  let wsURL = "ws://50.168.139.62/ws/test";

  // JSON message to send
  const message = {
    Type: 5,
    Ch: 0,
    Dev: 0,
    Data: {
      Cmd: 0,
      TrigType: 1,
      TrigTypeExt: 0,
      Condition: 0,
      Video: true,
      Audio: false,
      Smart: true,
      StartTime: 1729641600,
      StopTime: 1729727999,
      Multich: [[4, 1]],
    },
  };

  function findSupportedCodec() {
    const codec = 'video/mp4; codecs="avc1.64001E,mp4a.40.2"';
    if (!MediaSource.isTypeSupported(codec)) {
      throw new Error("Codec not supported");
    }
    return codec;
  }

  function initializeMediaSource() {
    return new Promise((resolve, reject) => {
      mediaSource = new MediaSource();
      video.src = URL.createObjectURL(mediaSource);

      let timeoutId = setTimeout(() => {
        reject(new Error("MediaSource open timeout"));
      }, 5000);

      mediaSource.addEventListener(
        "sourceopen",
        function onSourceOpen() {
          clearTimeout(timeoutId);
          mediaSource.removeEventListener("sourceopen", onSourceOpen);

          try {
            if (!sourceBuffer) {
              const codec = findSupportedCodec();
              sourceBuffer = mediaSource.addSourceBuffer(codec);
              sourceBuffer.mode = "segments";

              sourceBuffer.addEventListener("updateend", () => {
                if (isActive && segments.length > 0 && !sourceBuffer.updating) {
                  appendNextSegment();
                }
              });

              sourceBuffer.addEventListener("error", (e) => {
                console.error("SourceBuffer error:", e);
                handleError(new Error("SourceBuffer error occurred"));
              });
            }
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        { once: true }
      );
    });
  }

  function appendNextSegment() {
    if (!isActive || !sourceBuffer) return;
    if (sourceBuffer.updating) return;

    try {
      // Check if MediaSource is still open
      if (mediaSource.readyState !== "open") {
        console.error("MediaSource not open");
        return;
      }

      if (segments.length > 0) {
        const segment = segments.shift();
        console.log(`Appending segment of size: ${segment.byteLength}`);

        if (isFirstSegment) {
          isFirstSegment = false;
          console.log("Appending first segment");
        }

        sourceBuffer.appendBuffer(segment);
      }
    } catch (error) {
      console.error("Error in appendNextSegment:", error);
      if (error.name === "QuotaExceededError") {
        // Try to free up some buffer space
        if (sourceBuffer.buffered.length > 0) {
          const start = sourceBuffer.buffered.start(0);
          const end = sourceBuffer.buffered.end(0);
          if (end - start > 10) {
            sourceBuffer.remove(start, end - 10);
          }
        }
      } else {
        handleError(error);
      }
    }
  }

  async function startPlayback() {
    if (isActive) return;

    isActive = true;
    isFirstSegment = true;
    segments = [];

    try {
      if (!mediaSource || mediaSource.readyState !== "open") {
        await initializeMediaSource();
      }
      startWebSocket();
    } catch (error) {
      console.error("Error in startPlayback:", error);
      handleError(error);
    }
  }

  function startWebSocket() {
    if (ws) {
      ws.close();
    }

    ws = new WebSocket(wsURL, ["video-stream"]);
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      console.log("WebSocket connected, sending initial message");
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      if (!isActive) return;

      const data = new Uint8Array(event.data);
      console.log(`Received chunk: ${data.byteLength} bytes`);

      if (segments.length < 30) {
        // Limit buffer size
        segments.push(data);
        if (sourceBuffer && !sourceBuffer.updating) {
          appendNextSegment();
        }
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      if (isActive) {
        setTimeout(() => {
          startWebSocket();
        }, 1000);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      if (isActive) {
        setTimeout(() => {
          startWebSocket();
        }, 1000);
      }
    };
  }

  function softReset() {
    // Clear segments but keep the SourceBuffer
    segments = [];
    isFirstSegment = true;

    if (
      sourceBuffer &&
      !sourceBuffer.updating &&
      mediaSource.readyState === "open"
    ) {
      try {
        // Clear existing buffer
        if (sourceBuffer.buffered.length > 0) {
          const start = sourceBuffer.buffered.start(0);
          const end = sourceBuffer.buffered.end(0);
          sourceBuffer.remove(start, end);
        }
      } catch (e) {
        console.warn("Error during soft reset:", e);
      }
    }
  }

  function handleError(error) {
    console.error("Player error:", error);

    // Try soft reset first
    softReset();

    if (ws) {
      ws.close();
    }

    setTimeout(() => {
      if (isActive) {
        startWebSocket();
      }
    }, 1000);
  }

  function cleanup() {
    isActive = false;
    segments = [];

    if (ws) {
      ws.close();
      ws = null;
    }

    if (video) {
      video.pause();
      video.src = "";
      video.load();
    }

    // Don't remove the SourceBuffer, just clear it
    if (sourceBuffer && mediaSource?.readyState === "open") {
      try {
        if (sourceBuffer.buffered.length > 0) {
          const start = sourceBuffer.buffered.start(0);
          const end = sourceBuffer.buffered.end(0);
          sourceBuffer.remove(start, end);
        }
      } catch (e) {
        console.warn("Error clearing SourceBuffer:", e);
      }
    }
  }

  onMount(() => {
    startPlayback();
    return cleanup;
  });
</script>

<div class="video-container">
  <video
    bind:this={video}
    controls
    playsinline
    muted
    style="width: 100%; height: auto;"
    on:error={(e) => handleError(e)}
  />
</div>

<style>
  .video-container {
    width: 100%;
    position: relative;
  }
</style>
