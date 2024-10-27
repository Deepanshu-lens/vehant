<script>
  import { onMount, onDestroy } from "svelte";
  import { VideoStream } from "@/lib/video-stream";

  // Props
  export let url = ""; // WebSocket URL for the stream
  export let id = "";
  export let mode = "mse"; // Supported modes
  export let media = "video,audio"; // Requested media types
  export let background = false; // Run stream when not displayed
  export let visibilityThreshold = 0; // Viewport visibility threshold
  export let visibilityCheck = true; // Check browser tab visibility

  let videoElement;

  onMount(() => {
    // Ensure VideoStream is defined before using it
    if (!customElements.get("video-stream")) {
      customElements.define("video-stream", VideoStream);
    }

    // Configure the video stream element
    if (videoElement) {
      videoElement.mode = mode;
      videoElement.media = media;
      videoElement.background = background;
      videoElement.visibilityThreshold = visibilityThreshold;
      videoElement.visibilityCheck = visibilityCheck;

      // Set the source to start streaming
      if (url) {
        videoElement.src = url;
      }
    }
  });

  onDestroy(() => {
    if (videoElement) {
      videoElement.ondisconnect();
    }
  });

  // Handle stream URL changes
  $: if (videoElement && url) {
    videoElement.src = url;
  }
</script>

<div class="video-container">
  <video-stream bind:this={videoElement} class="video-player" {id} />
</div>

<style>
  .video-container {
    width: 100%;
    height: 100%;
    position: relative;
    background-color: black;
  }

  .video-player {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
