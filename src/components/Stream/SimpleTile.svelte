<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    export let url: string; // WebSocket URL passed as a prop

    let videoElement: HTMLVideoElement | null = null;
    let peerConnection: RTCPeerConnection | null = null;
    let ws: WebSocket | null = null;

    const iceServers = [
        {
            urls: "stun:3.145.176.80:3478", // STUN server for WebRTC
        },
    ];

    // WebSocket connection and WebRTC setup
    const setupWebRTC = () => {
        // Initialize WebSocket connection
        console.log("URL: ", url);
        ws = new WebSocket(url);

        ws.onopen = () => {
            console.log("WebSocket connection opened");
        };

        ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            console.log(message);

            // Check if it's the SDP offer
            if (message.type === "offer") {
                peerConnection = new RTCPeerConnection({ iceServers });

                // Add the WebRTC tracks to the video element
                peerConnection.ontrack = (event) => {
                    if (videoElement) {
                        videoElement.srcObject = event.streams[0];
                    }
                };

                // Set remote description from the SDP offer
                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(message),
                );

                // Create an answer for the SDP offer
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);

                // Send the SDP answer back to the WebSocket server
                ws.send(JSON.stringify(peerConnection.localDescription));
            }

            // ICE Candidate exchange
            if (message.candidate) {
                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(message.candidate),
                );
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed");
        };
    };

    // Cleanup WebSocket and PeerConnection on destroy
    const cleanup = () => {
        if (ws) ws.close();
        if (peerConnection) peerConnection.close();
    };

    onMount(() => {
        setupWebRTC();
    });

    onDestroy(() => {
        cleanup();
    });
</script>

<video bind:this={videoElement} autoplay playsinline></video>

<style>
    video {
        width: 100%;
        height: auto;
    }
</style>
