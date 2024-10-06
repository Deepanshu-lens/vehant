<script lang="ts">
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    // import { videoStreamStore, initWebSocket } from "../../stores/socketStore";
    export let url: string;

    console.log("!!!");

    let isVideoLoading = true;

    let videoElement: HTMLVideoElement | null = null;

    let fingerprint = "";

    class VideoStreamLib extends HTMLElement {
        // WebSocket connection to the video stream
        ws: WebSocket | null = null;

        loadingState: HTMLDivElement = null;

        // Video element to display the stream
        video: HTMLVideoElement | null = null;

        // WebSocket URL for the video stream
        wsURL: string | null | undefined = "";

        // WebRTC Peer Connection
        pc: RTCPeerConnection | null = null;

        // WebSocket connection state
        wsState: number = WebSocket.CLOSED;

        // WebRTC Peer Connection state
        pcState: number = WebSocket.CLOSED;

        // Codecs supported by Media Source Extensions
        mseCodecs: string = "";

        // Timeout durations for disconnect and reconnect
        DISCONNECT_TIMEOUT: number = 5000;
        RECONNECT_TIMEOUT: number = 50000;

        // List of supported codecs
        CODECS: string[] = [
            "avc1.640029", // H.264 high 4.1 (Chromecast 1st and 2nd Gen)
            "avc1.64002A", // H.264 high 4.2 (Chromecast 3rd Gen)
            "avc1.640033", // H.264 high 5.1 (Chromecast with Google TV)
        ];

        // Stream modes (webrtc, mse, hls, etc.)
        mode: string = "webrtc";

        // Media types (video, audio, etc.)
        media: string = "video";

        // Indicates whether to run the stream in the background
        background: boolean = true;

        // Threshold for stream visibility
        visibilityThreshold: number = 0;

        // Checks if the stream should be visible
        visibilityCheck: boolean = false;

        // WebRTC configuration
        pcConfig: RTCConfiguration = {
            iceServers: [{ urls: "stun:3.145.176.80:3478" }],
            bundlePolicy: "balanced",
            rtcpMuxPolicy: "require",
        };

        // WebSocket connection timestamp
        connectTS: number = 0;

        // Disconnect and reconnect timeout IDs
        disconnectTID: number = 5000;
        reconnectTID: number = 50000;

        pageLoadTime: number = window.performance.now(); // Time when the page started loading

        // Handlers for WebSocket messages and data
        ondata: ((data: ArrayBuffer) => void) | null = null;
        onmessage: { [key: string]: (msg: any) => void } = {};

        constructor() {
            super();
        }

        displayMetrics() {
            const shimmerTime =
                this.shimmerCreatedTime && this.websiteLoadTime
                    ? this.shimmerCreatedTime - this.websiteLoadTime
                    : "N/A";
            const videoTime = this.videoStartTime
                ? this.videoStartTime - this.pageLoadTime
                : "N/A";

            if (this.metricsDiv)
                this.metricsDiv.innerHTML = `
                <div class="metrics">
                    <p>Time-to-Canvas: ${(shimmerTime / 1000).toFixed(2)} sec</p>
                    <p>Canvas-to-Video: ${(videoTime / 1000).toFixed(2)} sec</p>
                    <p>Time-to-Video: ${((shimmerTime + videoTime) / 1000).toFixed(2)} sec</p>
                </div>
            `;
        }

        changeState(state: string) {
            console.log("CHANGE STATE TO ", state);
            // if (!this.video) return;/
            if (!this.loadingState) return;

            switch (state) {
                case "LOADING":
                    this.loadingState.style.display = "block";
                    this.video.style.display = "none";
                    break;
                case "LOADED":
                    this.loadingState.style.display = "none";
                    this.video.style.display = "block";
                    if (!this.videoStartTime) {
                        this.videoStartTime = window.performance.now();
                    }
                    // this.displayMetrics();
                    break;
                case "ERROR":
                    console.log("ERRORR!!!!!!!");
                    this.loadingState.style.display = "block";
                    console.log(this.loadingState.className);
                    this.loadingState.className =
                        this.loadingState.className.replace(
                            "bg-gray-300",
                            "bg-red-300",
                        );
                    break;
            }
        }

        connectedCallback() {
            this.wsURL = this.getAttribute("data-url");
            this.websiteLoadTime = this.getAttribute("data-time");

            if (this.disconnectTID) {
                clearTimeout(this.disconnectTID);
                this.disconnectTID = 0;
            }

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

        disconnectedCallback() {
            if (this.background || this.disconnectTID) return;

            if (
                this.wsState === WebSocket.CLOSED &&
                this.pcState === WebSocket.CLOSED
            )
                return;

            this.disconnectTID = window.setTimeout(() => {
                if (this.reconnectTID) {
                    clearTimeout(this.reconnectTID);
                    this.reconnectTID = 0;
                }

                this.disconnectTID = 0;

                this.ondisconnect();
            }, this.DISCONNECT_TIMEOUT);
        }

        oninit() {
            console.log("stream.oninit");

            this.video = document.createElement("video");
            this.video.controls = false;
            this.video.playsInline = true;
            this.video.preload = "auto";

            this.video.style.display = "block";
            this.video.className = "rounded-lg object-fit ";
            // this.video.style.width = "100%";
            // this.video.style.height = "100%";

            this.loadingState = document.createElement("div");
            this.loadingState.className =
                "absolute bg-gray-300 animate-pulse object-fit h-full rounded-lg";
            // this.loadingState.style.display = "block";
            this.loadingState.style.width = "100%";
            this.loadingState.style.height = "100%";

            this.metricsDiv = document.createElement("div");
            this.metricsDiv.style.width = "100%";
            this.metricsDiv.style.height = "100%";
            this.metricsDiv.className = "";

            this.appendChild(this.loadingState);
            this.appendChild(this.video);
            this.appendChild(this.metricsDiv);

            if (!this.shimmerCreatedTime) {
                this.shimmerCreatedTime = window.performance.now();
            }

            const m = window.navigator.userAgent.match(
                /Version\/(\d+).+Safari/,
            );

            if (m) {
                const skip =
                    m && m[1]
                        ? m[1] < "13"
                            ? "mp4a.40.2"
                            : m[1] < "14"
                              ? "flac"
                              : "opus"
                        : "opus";
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
                    { threshold: this.visibilityThreshold },
                );
                observer.observe(this);
            }
        }

        onconnect() {
            console.log("stream.onconnect, wsURL: ", this.wsURL);
            if (!this.isConnected || !this.wsURL || this.ws || this.pc)
                return false;

            this.wsState = WebSocket.CONNECTING;
            this.connectTS = Date.now();

            this.ws = new WebSocket(this.wsURL);
            // this.ws = initWebSocket(this.wsURL);

            this.ws.binaryType = "arraybuffer";
            this.ws.addEventListener("open", () => this.onopen());
            this.ws.addEventListener("close", () => this.onclose());

            return true;
        }

        onopen() {
            console.log("stream.onopen");
            this.wsState = WebSocket.OPEN;

            this.ws &&
                this.ws.addEventListener("message", (ev) => {
                    if (typeof ev.data === "string") {
                        const msg = JSON.parse(ev.data);
                        console.log("!!!!msg", msg);
                        if (msg.value) {
                            // console.log("connection error", this.wsURL);
                            // const camName =
                            //     this.wsURL && this.wsURL.split("&cn=")[1];
                            // console.error(
                            //     `Connection error: No connection could be made with ${camName}!`,
                            // );
                            // this.changeState("ERROR");
                        }
                        for (const mode in this.onmessage) {
                            this.onmessage[mode] && this.onmessage[mode](msg);
                        }
                    } else {
                        this.ondata && this.ondata(ev.data);
                    }
                });

            this.ondata = null;
            this.onmessage = {};

            const modes: string[] = [];

            if (
                this.mode.indexOf("mse") >= 0 &&
                ("MediaSource" in window || "ManagedMediaSource" in window)
            ) {
                modes.push("mse");
                this.onmse();
            } else if (
                this.mode.indexOf("hls") >= 0 &&
                this.video &&
                this.video.canPlayType("application/vnd.apple.mpegurl")
            ) {
                modes.push("hls");
                this.onhls();
            } else if (this.mode.indexOf("mp4") >= 0) {
                modes.push("mp4");
                this.onmp4();
            }

            if (
                this.mode.indexOf("webrtc") >= 0 &&
                "RTCPeerConnection" in window
            ) {
                modes.push("webrtc");
                this.onwebrtc();
            }

            if (this.mode.indexOf("mjpeg") >= 0) {
                if (modes.length) {
                    this.onmessage["mjpeg"] = (msg) => {
                        if (
                            msg.type !== "error" ||
                            msg.value.indexOf(modes[0]) !== 0
                        )
                            return;
                        this.onmjpeg();
                    };
                } else {
                    modes.push("mjpeg");
                    this.onmjpeg();
                }
            }

            return modes;
        }

        // @ts-expect-error
        override onclose() {
            console.log("stream.onclose");
            if (this.wsState === WebSocket.CLOSED) return false;

            this.wsState = WebSocket.CONNECTING;
            this.ws = null;

            const delay = Math.max(
                this.RECONNECT_TIMEOUT - (Date.now() - this.connectTS),
                0,
            );

            this.reconnectTID = window.setTimeout(() => {
                this.reconnectTID = 0;
                this.onconnect();
            }, delay);

            return true;
        }

        ondisconnect() {
            console.log("stream.ondisconnect");
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

            if (this.video) this.video.src = "";
            if (this.video) this.video.srcObject = null;
        }

        play() {
            this.video &&
                this.video.play().catch(() => {
                    if (this.video && !this.video.muted) {
                        this.video.muted = true;
                        this.video.play().catch((er) => {
                            console.warn(er);
                        });
                    }
                });
        }

        send(value: any) {
            if (this.ws) this.ws.send(JSON.stringify(value));
        }

        codecs(isSupported: (type: string) => boolean) {
            return this.CODECS.filter(
                (codec) =>
                    this.media.indexOf(
                        codec.indexOf("vc1") > 0 ? "video" : "audio",
                    ) >= 0,
            )
                .filter((codec) => isSupported(`video/mp4; codecs="${codec}"`))
                .join();
        }

        // Methods to handle MSE, WebRTC, HLS, MP4, and MJPEG
        onmse() {
            /** @type {MediaSource} */
            let ms;
            console.log("here");
            if ("ManagedMediaSource" in window) {
                const MediaSource = window.ManagedMediaSource;

                ms = new (window as any).MediaSource();
                ms.addEventListener(
                    "sourceopen",
                    () => {
                        this.send({
                            type: "mse",
                            value: this.codecs(
                                (MediaSource as any).isTypeSupported,
                            ),
                        });
                    },
                    { once: true },
                );

                if (this.video) this.video.disableRemotePlayback = true;
                if (this.video) this.video.srcObject = ms;
            } else {
                ms = new MediaSource();
                ms.addEventListener(
                    "sourceopen",
                    () => {
                        this.video && URL.revokeObjectURL(this.video.src);
                        this.send({
                            type: "mse",
                            value: this.codecs(MediaSource.isTypeSupported),
                        });
                    },
                    { once: true },
                );

                if (this.video) this.video.src = URL.createObjectURL(ms);
                if (this.video) this.video.srcObject = null;
            }

            this.play();

            this.mseCodecs = "";

            this.onmessage["mse"] = (msg) => {
                if (msg.type !== "mse") return;

                this.mseCodecs = msg.value;

                const sb = ms.addSourceBuffer(msg.value);
                sb.mode = "segments"; // segments or sequence

                console.log("sb", msg.value);
                sb.addEventListener("updateend", () => {
                    if (sb.updating) return;

                    try {
                        if (bufLen > 0) {
                            const data = buf.slice(0, bufLen);
                            bufLen = 0;
                            sb.appendBuffer(data);
                        } else if (sb.buffered && sb.buffered.length) {
                            const end =
                                sb.buffered.end(sb.buffered.length - 1) - 15;
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

                const candidate = ev.candidate
                    ? ev.candidate.toJSON().candidate
                    : "";
                this.send({ type: "webrtc/candidate", value: candidate });
            });

            pc.addEventListener("connectionstatechange", () => {
                if (pc.connectionState === "connected") {
                    const tracks = pc
                        .getReceivers()
                        .map((receiver) => receiver.track);
                    /** @type {HTMLVideoElement} */
                    const video2 = document.createElement("video");
                    video2.addEventListener(
                        "loadeddata",
                        () => this.onpcvideo(video2),
                        {
                            once: true,
                        },
                    );
                    video2.srcObject = new MediaStream(tracks);
                } else if (
                    pc.connectionState === "failed" ||
                    pc.connectionState === "disconnected"
                ) {
                    pc.close(); // stop next events

                    this.pcState = WebSocket.CLOSED;
                    this.pc = null;

                    this.changeState("ERROR");

                    this.onconnect();
                }
            });

            this.onmessage["webrtc"] = (msg) => {
                switch (msg.type) {
                    case "webrtc/candidate":
                        if (
                            this.mode.indexOf("webrtc/tcp") >= 0 &&
                            msg.value.indexOf(" udp ") > 0
                        ) {
                            console.log("WHAT AM I DOING?!", msg.value);
                            return;
                        }
                        const candidateText = `candidate:${msg.value.CandidateID} 1 udp ${msg.value.Priority} ${msg.value.IPAddress} ${msg.value.Port} typ srflx raddr 0.0.0.0 rport ${msg.value.Port}`;

                        pc.addIceCandidate({
                            candidate: candidateText,
                            // candidiate:
                            // "candidate:3170878026 1 udp 1694498815 18.218.162.33 56075 typ srflx raddr 0.0.0.0 rport 36426",
                            sdpMid: "0",
                        }).catch((er) => {
                            console.warn(er);
                        });
                        break;
                    case "webrtc/answer":
                        const sdpTemplate = `v=0\r\no=- ${msg.value.session_ids[0][0]} ${msg.value.session_ids[0][1]} IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=msid-semantic:WMS*\r\na=fingerprint:sha-256 ${msg.value.fingerprint[0][0]}\r\na=extmap-allow-mixed\r\na=group:BUNDLE 0\r\nm=video 9 UDP/TLS/RTP/SAVPF 102 106 112\r\nc=IN IP4 0.0.0.0\r\na=setup:active\r\na=mid:0\r\na=ice-ufrag:${msg.value.ice_ufrag[0]}\r\na=ice-pwd:${msg.value.ice_pwd[0]}\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:102 H264/90000\r\na=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\na=rtcp-fb:102 goog-remb \r\na=rtcp-fb:102 transport-cc \r\na=rtcp-fb:102 ccm fir\r\na=rtcp-fb:102 nack \r\na=rtcp-fb:102 nack pli\r\na=rtpmap:106 H264/90000\r\na=fmtp:106 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtcp-fb:106 goog-remb \r\na=rtcp-fb:106 transport-cc \r\na=rtcp-fb:106 ccm fir\r\na=rtcp-fb:106 nack \r\na=rtcp-fb:106 nack pli\r\na=rtpmap:112 H264/90000\r\na=fmtp:112 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f\r\na=rtcp-fb:112 goog-remb \r\na=rtcp-fb:112 transport-cc \r\na=rtcp-fb:112 ccm fir\r\na=rtcp-fb:112 nack \r\na=rtcp-fb:112 nack pli\r\na=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=ssrc:${msg.value.ssrc[0]} cname:go2rtc\r\na=ssrc:${msg.value.ssrc[0]} msid:go2rtc go2rtc-video\r\na=ssrc:${msg.value.ssrc[0]} mslabel:go2rtc\r\na=ssrc:${msg.value.ssrc[0]} label:go2rtc-video\r\na=msid:go2rtc go2rtc-video\r\na=sendonly\r\n`;

                        console.log("sdpTemplate", sdpTemplate);
                        pc.setRemoteDescription({
                            type: "answer",
                            sdp: sdpTemplate,
                            // sdp: "v=0\r\no=- 3402621495359557601 1727908515 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=msid-semantic:WMS*\r\na=fingerprint:sha-256 79:0B:4C:B8:C4:B9:07:A2:AF:AA:2F:F3:F5:20:70:97:71:00:30:F2:CA:14:DF:0A:33:4A:39:4A:E2:B4:9C:49\r\na=extmap-allow-mixed\r\na=group:BUNDLE 0 1\r\nm=video 9 UDP/TLS/RTP/SAVPF 102 106 112\r\nc=IN IP4 0.0.0.0\r\na=setup:active\r\na=mid:0\r\na=ice-ufrag:amSVKVPdAuZnakKe\r\na=ice-pwd:NhUPntMOFymLCBAEEINXSLTqqBNYHyDN\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:102 H264/90000\r\na=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\na=rtcp-fb:102 goog-remb \r\na=rtcp-fb:102 transport-cc \r\na=rtcp-fb:102 ccm fir\r\na=rtcp-fb:102 nack \r\na=rtcp-fb:102 nack pli\r\na=rtpmap:106 H264/90000\r\na=fmtp:106 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtcp-fb:106 goog-remb \r\na=rtcp-fb:106 transport-cc \r\na=rtcp-fb:106 ccm fir\r\na=rtcp-fb:106 nack \r\na=rtcp-fb:106 nack pli\r\na=rtpmap:112 H264/90000\r\na=fmtp:112 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f\r\na=rtcp-fb:112 goog-remb \r\na=rtcp-fb:112 transport-cc \r\na=rtcp-fb:112 ccm fir\r\na=rtcp-fb:112 nack \r\na=rtcp-fb:112 nack pli\r\na=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=ssrc:251836344 cname:go2rtc\r\na=ssrc:251836344 msid:go2rtc go2rtc-video\r\na=ssrc:251836344 mslabel:go2rtc\r\na=ssrc:251836344 label:go2rtc-video\r\na=msid:go2rtc go2rtc-video\r\na=sendonly\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 0 8\r\nc=IN IP4 0.0.0.0\r\na=setup:active\r\na=mid:1\r\na=ice-ufrag:amSVKVPdAuZnakKe\r\na=ice-pwd:NhUPntMOFymLCBAEEINXSLTqqBNYHyDN\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\na=rtcp-fb:111 transport-cc \r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=ssrc:3222239363 cname:go2rtc\r\na=ssrc:3222239363 msid:go2rtc go2rtc-audio\r\na=ssrc:3222239363 mslabel:go2rtc\r\na=ssrc:3222239363 label:go2rtc-audio\r\na=msid:go2rtc go2rtc-audio\r\na=inactive\r\n",
                        }).catch((er) => {
                            console.warn(er);
                        });

                        // fingerprint = msg.value;

                        break;
                    case "error":
                        if (msg.value.indexOf("webrtc/offer") < 0) return;
                        pc.close();
                        this.changeState("ERROR");
                }
            };

            this.createOffer(pc).then((offer) => {
                var results = {};
                const regexPatterns = {
                    session_ids: /o=- (\d+) (\d+) IN IP4/,
                    fingerprint: /fingerprint:sha-256 ([A-F0-9:]+)/,
                    ice_ufrag: /ice-ufrag:(\S+)/,
                    ice_pwd: /ice-pwd:(\S+)/,
                    ssrc: /ssrc:(\d+)/,
                };
                for (const key in regexPatterns) {
                    const regex = regexPatterns[key];
                    const match = offer.sdp.match(regex);
                    if (match) {
                        results[key] = match.slice(1); // Capture groups
                    }
                }
                this.send({
                    type: "webrtc/offer",
                    offer: results,
                    // original: offer.sdp,
                });
            });

            this.pcState = WebSocket.CONNECTING;
            this.pc = pc;
        }

        /**
         * @param pc {RTCPeerConnection}
         * @return {Promise<RTCSessionDescriptionInit>}
         */
        async createOffer(pc: any) {
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
        onpcvideo(video2: any) {
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
                    if (this.video) this.video.srcObject = stream;
                    this.changeState("LOADED");
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
        onhls() {}
        onmp4() {}
        onmjpeg() {}
    }
    const loadWebsiteTime = async () => {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (window.websiteLoadTime) {
                    clearInterval(interval); // Clear the interval once it's found
                    resolve(window.websiteLoadTime);
                }
            }, 50); // Check every 50ms
        });
    };
    onMount(() => {
        if (!customElements.get("lens-view-stream-tile-svelte")) {
            customElements.define(
                "lens-view-stream-tile-svelte",
                VideoStreamLib,
            );
        }
    });
</script>

<!-- <div class="w-full h-full relative"> -->
<lens-view-stream-tile-svelte
    bind:this={videoElement}
    data-url={url}
    class="w-full h-full relative"
></lens-view-stream-tile-svelte>
<!-- </div> -->
