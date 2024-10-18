<script lang="ts">
  import Hls from "hls.js";
  //   import mpegts from "mpegts.js";

  //   import { onMount, onDestroy } from "svelte";

  let videoElement;

  //   onMount(() => {
  //     if (Hls.isSupported()) {
  //       const hls = new Hls();
  //       hls.loadSource("/playback.ts");
  //       hls.attachMedia(videoElement);
  //       hls.on(Hls.Events.MANIFEST_PARSED, function () {
  //         console.log("playing");
  //         videoElement.play();
  //       });
  //     } else {
  //       console.error("HLS is not supported in this browser.");
  //       // Implement fallback or user notification here
  //     }
  //   });
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<div class="video-player">
  <video bind:this={videoElement} muted autoplay controls src={"/playback.ts"}
  ></video>
</div>

<style>
  .video-player {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  video {
    width: 100%;
  }

  .controls {
    display: flex;
    align-items: center;
    margin-top: 10px;
  }

  input[type="range"] {
    flex-grow: 1;
    margin: 0 10px;
  }
</style>
