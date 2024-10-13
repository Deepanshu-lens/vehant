<script lang="ts">
  import pb from "@/lib/sharedPB";
  import { nodes } from "@/stores";
  import type { Node } from "@/types";

  (async () => {
    try {
      // Fetch initial data
      const localNodes = await pb.collection("node").getFullList<Node>({
        fields: "id,name",
      });
      nodes.set(localNodes);
    } catch (error) {
      console.error("Error initializing Camera Manager:", error);
    }
  })();

  // //   initCameraManager();
  // try {
  //   pb.collection("node").subscribe("*", (e) => {
  //     console.log("Camera collection updated", e.action, e.record);
  //   });
  // } catch (error) {
  //   console.error("Failed realtime camera");
  // }

  $: console.log("Nodes: ", $nodes);
</script>
