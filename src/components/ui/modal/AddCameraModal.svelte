<script lang="ts">
  import pb from "@/lib/sharedPB";
  import { selectedNode } from "@/stores";
  import * as Dialog from "@/components/ui/dialog";
  import AddCameraForm from "@/components/Forms/AddCamera.svelte";

  let modalOpen = false;
  let cameraName = "";
  let mainUrl = "";
  let subUrl = "";
  let doneSubmit = false;

  // async function addCamera() {
  //   try {
  //     // Create the camera record in Pocketbase
  //     const data = {
  //       name: cameraName,
  //       url: mainUrl,
  //       subUrl,
  //       motionSensitivity: 33, // Example value
  //       node: $selectedNode,
  //     };

  //     // Push the data to Pocketbase (to the 'cameras' collection, for example)
  //     const record = await pb.collection("camera").create(data);
  //     console.log("Camera added:", record);
  //     modalOpen = false;
  //   } catch (error) {
  //     console.error("Failed to add camera:", error);
  //   }
  // }

  $: {
    if (doneSubmit) {
      modalOpen = false;
      doneSubmit = false;
    }
  }
</script>

<Dialog.Root bind:open={modalOpen}>
  <Dialog.Trigger><slot /></Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="border-b pb-4">Add Camera</Dialog.Title>
    </Dialog.Header>
    <AddCameraForm bind:cameraName bind:mainUrl bind:subUrl bind:doneSubmit />
  </Dialog.Content>
</Dialog.Root>
