<script lang="ts">
  import pb from "@/lib/sharedPB";
  import * as AlertDialog from "@/components/ui/alert-dialog";
  import { selectedNode, nodes, user } from "@/stores";
  const deleteNode = async () => {
    const record = await pb
      .collection("node")
      .delete($nodes.find((n) => n.id === $selectedNode)?.id);
  };

  $: $nodes.length > 0 && selectedNode.set($nodes[0].id);
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger><slot /></AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
      <AlertDialog.Description>
        Deleting a node cannot be undone. This will permanently delete your node
        and remove all associated sub-nodes and cameras from our servers.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action on:click={deleteNode} class="bg-rose-500 text-white"
        >Delete</AlertDialog.Action
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
