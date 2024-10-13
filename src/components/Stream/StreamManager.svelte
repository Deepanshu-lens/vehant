<script lang="ts">
  import StreamLayout from "./StreamLayout2.svelte";
  import { cameras, selectedLayout } from "@/stores/store";

  // import { writable } from "svelte/store";
  // import PocketBase from "pocketbase";
  import { onMount, onDestroy } from "svelte";

  // const pb = new PocketBase("http://localhost:8090");

  let layout = 0;
  $: layout = $selectedLayout;

  // const fetchInitialCameras = async () => {
  //   try {
  //     const records = await pb.collection("camera").getFullList();
  //     console.log(records);
  //     cameras.set(
  //       records.map((record: any) => ({
  //         name: record.name,
  //         url: record.url,
  //         id: record.id,
  //       }))
  //     );
  //   } catch (error) {
  //     console.error("Failed to fetch initial camera data:", error);
  //   }
  // };

  // // Set up real-time subscription
  // const setupRealtimeSubscription = () => {
  //   pb.collection("camera").subscribe("*", (e) => {
  //     console.log("Camera collection updated", e.action, e.record);

  //     if (e.action === "create" || e.action === "update") {
  //       cameras.update((currentCameras) => {
  //         const updatedCameras = [...currentCameras];

  //         // Find the index of the camera based on its id
  //         const existingIndex = updatedCameras.findIndex(
  //           (camera) => camera.id === e.record.id
  //         );

  //         const newCamera: Camera = {
  //           name: e.record.name, // Assuming `name` is in the Pocketbase record
  //           url: e.record.url, // Assuming `url` is in the Pocketbase record
  //           id: e.record.id, // Assuming `id` is in the Pocketbase record
  //         };

  //         if (existingIndex !== -1) {
  //           // Update the existing camera
  //           updatedCameras[existingIndex] = newCamera;
  //         } else {
  //           // Add the new camera
  //           updatedCameras.push(newCamera);
  //         }

  //         return updatedCameras;
  //       });
  //     } else if (e.action === "delete") {
  //       cameras.update((currentCameras) => {
  //         // Filter out the camera with the matching id
  //         return currentCameras.filter((camera) => camera.id !== e.record.id);
  //       });
  //     }
  //   });
  // };

  let currentCameras = $cameras;
  $: currentCameras = $cameras;
  $: console.log("fetched ", currentCameras);

  // onMount(() => {
  //   fetchInitialCameras();
  //   setupRealtimeSubscription();
  // });

  // onDestroy(() => {
  //   pb.collection("cameras").unsubscribe("*");
  // });
</script>

<!-- Camera Grid Rendering -->
<!-- <StreamLayout cameras={currentCameras} {layout} /> -->
