<script lang="ts">
  import { onMount } from "svelte";
  import pb from "@/lib/sharedPB";
  import { selectedNode, cameras } from "@/stores";
  import type { Camera } from "@/types";

  import { validateCamera } from "@/validateSchema";

  const getInitialCameras = async (nodeId: string) => {
    try {
      const localCameras = await pb.collection("camera").getFullList<Camera>({
        fields: "id,name,url,subUrl",
        filter: `node.id ?= "${nodeId}"`,
      });
      cameras.set(localCameras);
    } catch (error) {
      console.error("Error initializing Camera Manager:", error);
    }
  };

  $: getInitialCameras($selectedNode);

  // let unsubscribeCamera: Function | null = null;
  // const subscribeToNodeCameras = (nodeId: string) => {
  //   if (unsubscribeCamera) {
  //     // Unsubscribe from the previous subscription if it exists
  //     unsubscribeCamera();
  //   }

  //   // Subscribe to cameras of the selected node
  //   unsubscribeCamera = pb.collection("camera").subscribe("*", (e) => {
  //     console.log("Camera collection updated", e.action, e.record);
  //     if (e.record.node === nodeId) {
  //       if (e.action === "create") {
  //         const validated = validateCamera(e.record);
  //         if (validated) cameras.set((current) => [...current, validated]);
  //       } else if (e.action === "update") {
  //         const validated = validateCamera(e.record);
  //         if (validated)
  //           cameras.update((current) =>
  //             current.map((cam) => (cam.id === validated.id ? validated : cam))
  //           );
  //       } else if (e.action === "delete") {
  //         cameras.update((current) =>
  //           current.filter((cam) => cam.id !== e.record.id)
  //         );
  //       }
  //     }
  //   });
  // };

  // $: $selectedNode &&
  //   getInitialCameras($selectedNode) &&
  //   subscribeToNodeCameras($selectedNode);

  try {
    pb.collection("camera").subscribe("*", (e) => {
      console.log("Camera collection updated", e.action, e.record);
      if (e.action === "create") {
        const validated = validateCamera(e.record);
        if (validated) cameras.update((current) => [...current, validated]);
      } else if (e.action === "update") {
        const validated = validateCamera(e.record);
        if (validated)
          cameras.update((current) =>
            current.map((cam) => (cam.id === validated.id ? validated : cam))
          );
      } else if (e.action === "delete") {
        cameras.update((current) =>
          current.filter((cam) => cam.id !== e.record.id)
        );
      }
    });
  } catch (error) {
    console.error("Failed realtime camera");
  }
</script>
