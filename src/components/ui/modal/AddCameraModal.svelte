<script lang="ts">
  import { Button } from "@/components/ui/button";
  import pb from "@/lib/sharedPB";
  import { selectedNode } from "@/stores";
  import * as Dialog from "@/components/ui/dialog";
  import AddCameraForm from "@/components/Forms/AddCamera.svelte";

  let modalOpen = false;
  let cameraName = "";
  let mainUrl = "";
  let subUrl = "";

  async function addCamera() {
    try {
      // Create the camera record in Pocketbase
      const data = {
        name: cameraName,
        url: mainUrl,
        subUrl,
        motionSensitivity: 33, // Example value
        node: $selectedNode,
      };

      // Push the data to Pocketbase (to the 'cameras' collection, for example)
      const record = await pb.collection("camera").create(data);
      console.log("Camera added:", record);
      modalOpen = false;
    } catch (error) {
      console.error("Failed to add camera:", error);
    }
  }

  $: console.log("cameraname:", cameraName);
</script>

<Dialog.Root bind:open={modalOpen}>
  <Dialog.Trigger><slot /></Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="border-b pb-4">Add Camera</Dialog.Title>
    </Dialog.Header>
    <AddCameraForm bind:cameraName bind:mainUrl bind:subUrl />
    <Dialog.Footer class="flex flex-1 flex-col mx-auto">
      <Button
        type="submit"
        class="bg-[#015A62] text-white font-semibold"
        on:click={() => addCamera()}>Confirm</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
