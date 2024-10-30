<script lang="ts">
  import * as Dialog from "@/components/ui/dialog";
  import { Input } from "@/components/ui/input";
  import pb from "@/lib/sharedPB";
  import { Label } from "@/components/ui/label";
  import { Button } from "@/components/ui/button";
  import { selectedNode, nodes, user } from "@/stores";

  let nodeName = "";
  let modalOpen = false;

  const editNode = async () => {
    const data = {
      name: nodeName,
      session: $user.session[0],
    };
    const record = await pb
      .collection("node")
      .update($nodes.find((n) => n.id === $selectedNode)?.id, data);
    selectedNode.set(record.id);
    modalOpen = false;
  };
</script>

<Dialog.Root bind:open={modalOpen}>
  <Dialog.Trigger><slot /></Dialog.Trigger>
  <Dialog.Content class="sm:max-w-[48rem]">
    <Dialog.Header>
      <Dialog.Title class="border-b pb-4">Edit Node</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-1">
      <Label for="nodeName">Name</Label>
      <Input
        id="nodeName"
        placeholder={$nodes.find((n) => n.id === $selectedNode)?.name}
        bind:value={nodeName}
      />
    </div>
    <Dialog.Footer class="flex items-center justify-between">
      <Button
        type="submit"
        class="bg-[#015A62] text-white font-semibold"
        on:click={editNode}
        disabled={nodeName === ""}>Confirm</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
