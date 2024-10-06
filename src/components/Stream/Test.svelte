<script lang="ts">
    import { onMount } from "svelte";
    export let url: string; // Pass url from parent

    class VideoStreamLib extends HTMLElement {
        ws: WebSocket | null = null;
        video: HTMLVideoElement | null = null;
        wsURL: string | null = null;
        pc: RTCPeerConnection | null = null;

        constructor() {
            super();
        }

        connectedCallback() {
            this.wsURL = this.getAttribute("data-url"); // Access the url from the attribute
            console.log("Connected element with URL:", this.wsURL);

            if (this.wsURL) {
                this.startStream();
            }
        }

        disconnectedCallback() {
            console.log("Disconnecting stream for:", this.wsURL);
            // Cleanup logic here
        }

        startStream() {
            // Your WebSocket or WebRTC logic here
            console.log("Starting stream for:", this.wsURL);
            this.ws = new WebSocket(this.wsURL);
        }
    }

    onMount(() => {
        // Ensure that the custom element is defined only once
        if (!customElements.get("lens-view-stream-tile")) {
            customElements.define("lens-view-stream-tile", VideoStreamLib);
        }
    });
</script>

<!-- Pass the `url` as a `data-url` attribute directly to ensure each instance has the correct URL -->
<lens-view-stream-tile data-url={url} class="w-full h-full rounded-lg"
></lens-view-stream-tile>
