<script lang="ts">
  import pb from "@/lib/sharedPB";
  import * as AlertDialog from "@/components/ui/alert-dialog";
  import { selectedNode, nodes, user } from "@/stores";
  export let camera;

  const deleteCamera = async () => {
    const record = await pb.collection("camera").delete(camera.id);
  };
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger><slot /></AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
      <AlertDialog.Description>
        Deleting a camera cannot be undone. This will permanently delete your
        camera from our servers.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action on:click={deleteCamera} class="bg-rose-500 text-white"
        >Delete</AlertDialog.Action
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
