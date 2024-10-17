<script lang="ts">
  import { onMount } from "svelte";
  import { cameras, nodes, selectedNode } from "@/stores";
  import Sortable from "sortablejs";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import GhostIconButton from "@/components/ui/custom/GhostIconButton.svelte";
  import AddCameraModal from "@/components/ui/modal/AddCameraModal.svelte";
  import DeleteCameraModal from "@/components/ui/modal/DeleteCameraModal.svelte";
  import EditCameraModal from "@/components/ui/modal/EditCameraModal.svelte";
  import EditNodeModal from "@/components/ui/modal/EditNodeModal.svelte";
  import AddNodeModal from "@/components/ui/modal/AddNodeModal.svelte";
  import DeleteNodeModal from "@/components/ui/modal/DeleteNodeModal.svelte";
  import Icon from "@iconify/svelte";
  import * as Select from "@/components/ui/select/index.js";
  import { cn } from "@/lib/utils";

  export let smallList = false;

  let currentCameras = $cameras;
  $: currentCameras = $cameras;

  let cameraItems: HTMLDivElement;
  onMount(function () {
    if (cameraItems) {
      Sortable.create(cameraItems, {
        animation: 250,
        chosenClass: "chosen",
        dragClass: "dragged",
        handle: ".my-handle",
      });
    }
  });
  $: console.log($cameras);
  let selectedValue = {
    value: $selectedNode,
    label: $nodes.find((n) => n.id === $selectedNode)?.name,
  };
  $: selectedValue = {
    value: $selectedNode,
    label: $nodes.find((n) => n.id === $selectedNode)?.name,
  };
  $: console.log(
    "Selected node changed: ",
    $selectedNode,
    $nodes.find((n) => n.id === $selectedNode)?.name
  );

  function handleInput(event) {
    let searchQuery = event.target.value.toLowerCase();
    let filteredCameras = $cameras.filter((camera) => {
      const nameMatch = camera.name.toLowerCase().includes(searchQuery);
      const urlMatch = camera.url.toLowerCase().includes(searchQuery);
      const subUrlMatch =
        camera.subUrl && camera.subUrl.toLowerCase().includes(searchQuery);
      return nameMatch || urlMatch || subUrlMatch;
    });
    currentCameras = filteredCameras;
    console.log(filteredCameras);
  }
</script>

<!-- {#if currentCameras.length > 0} -->
<div class="flex-grow border-l overflow-y-auto">
  <section class="border-b w-full p-2 px-4">
    <div
      class={`flex ${smallList && "flex-col space-y-2"} justify-between items-center`}
    >
      <!-- <span>Node:</span> -->
      <Select.Root
        items={$nodes}
        onSelectedChange={(e) => {
          selectedNode.set(e.value);
        }}
        bind:selected={selectedValue}
      >
        <Select.Trigger class="w-full">
          <span class="text-muted-foreground">Node:</span>
          <Select.Value placeholder="Cameras" />
        </Select.Trigger>
        <Select.Content>
          {#each $nodes as node}
            <Select.Item value={node.id} label={node.name}
              >{node.name}</Select.Item
            >
          {/each}
        </Select.Content>
      </Select.Root>
      <div
        class={cn(
          "flex items-center",
          smallList ? "justify-between w-full" : "space-x-0"
        )}
      >
        <AddNodeModal
          >{#if !smallList}<GhostIconButton>
              <Icon
                icon="mdi:add-circle-outline"
                width={20}
                class="dark:text-white"
              />
            </GhostIconButton>
          {:else}
            <Button variant="outline" size="sm" class="text-xs">Add</Button>
          {/if}</AddNodeModal
        >

        <EditNodeModal>
          {#if !smallList}
            <GhostIconButton>
              <Icon
                icon="material-symbols:edit-square-outline"
                width={20}
                class="dark:text-white"
              />
            </GhostIconButton>
          {:else}
            <Button variant="outline" size="sm" class="text-xs dark:text-white"
              >Edit</Button
            >
          {/if}</EditNodeModal
        >

        <DeleteNodeModal>
          {#if !smallList}
            <GhostIconButton>
              <Icon
                icon="mdi:trash-outline"
                width={20}
                class="dark:text-white"
              />
            </GhostIconButton>{:else}
            <Button variant="outline" size="sm" class="text-xs dark:text-white"
              >Delete</Button
            >{/if}</DeleteNodeModal
        >
      </div>
    </div>
  </section>
  <div
    id="camera-items"
    class={`flex flex-col gap-4 w-full max-w-screen-md mx-auto max-h-[calc(100vh-3rem)] overflow-y-auto overflow-x-clip
                  transition-all duration-100 fade-in-0
                  p-4 
                  rounded-lg`}
    bind:this={cameraItems}
  >
    <div class="relative">
      <Icon
        icon="material-symbols:search-rounded"
        class="w-22 h-22 absolute left-3 top-1/2 transform -translate-y-1/2 scale-x-[-1]"
      />
      <Input
        type="text"
        name="text"
        placeholder="Search..."
        class="pl-10 w-full border rounded-md"
        on:input={handleInput}
      />
    </div>

    {#each currentCameras as camera, index}
      <article
        class={`flex ${smallList ? "flex-col gap-1" : "gap-4"} items-center  p-4 dark:border 
              hover:border hover:border-primary 
              rounded-xl shadow-md text-sm z-10 w-full px-4
          `}
      >
        {#if !smallList}
          <Icon
            icon="material-symbols:menu"
            class="h-4 w-4 cursor-grab flex-shrink-0 my-handle"
          />{/if}
        <div class="grid gap-1">
          <h3 class="text-sm font-medium whitespace-nowrap truncate">
            {camera.name?.length > 11
              ? camera.name?.substring(0, 10) + "..."
              : camera.name}
          </h3>
          <p class={`text-xs w-full ${smallList ? "hidden" : "truncate"}`}>
            {camera.url?.split("@")?.[1]?.split("/")?.[0]?.split(":")?.[0]}
          </p>
        </div>

        <ul
          class={`flex flex-row gap-0 ${!smallList && "xl:ml-auto"} p-0 list-none cursor-pointer items-end`}
        >
          <li class="cursor-pointer">
            <EditCameraModal {camera}>
              <GhostIconButton>
                <Icon
                  icon="material-symbols:edit-square-outline"
                  width={14}
                  class="dark:text-white p-0"
                />
              </GhostIconButton>
            </EditCameraModal>
          </li>
          <!-- <li class="cursor-pointer">
            <GhostIconButton>
              <Icon icon="mdi:settings" width={14} class="dark:text-white" />
            </GhostIconButton>
          </li> -->
          <li class="cursor-pointer">
            <DeleteCameraModal {camera}>
              <GhostIconButton>
                <Icon
                  icon="mdi:trash-outline"
                  width={14}
                  class="dark:text-white"
                />
              </GhostIconButton>
            </DeleteCameraModal>
          </li>
        </ul>
      </article>
    {/each}
    <AddCameraModal>
      <Button class="w-full truncate">Add a camera</Button>
    </AddCameraModal>
  </div>
</div>
<!-- {/if} -->
