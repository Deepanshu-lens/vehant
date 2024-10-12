import { writable } from "svelte/store";

interface Camera {
  name: string;
  url: string;
  id: string;
}

export const cameras = writable<Camera[]>([]);
export const selectedLayout = writable<number>(0);

// // Function to initialize or reuse WebSocket connection
// export function initWebSocket(url: string): WebSocket {
//     let ws: WebSocket;

//     videoStreamStore.update((currentWS) => {
//         if (currentWS && currentWS.readyState === WebSocket.OPEN) {
//             ws = currentWS;
//         } else {
//             ws = new WebSocket(url);
//             ws.onopen = () => console.log('WebSocket opened');
//             ws.onclose = () => console.log('WebSocket closed');
//             ws.onerror = (error) => console.error('WebSocket error:', error);

//             // Save the new connection in the store
//             videoStreamStore.set(ws);
//         }
//         return ws;
//     });

//     return ws;
// }
