<script lang="ts">
  import { onMount } from "svelte";
  import { cameras } from "@/stores";
  import Sortable from "sortablejs";
  import { Button } from "@/components/ui/button";
  import GhostIconButton from "@/components/ui/custom/GhostIconButton.svelte";
  import AddCameraModal from "@/components/ui/modal/AddCameraModal.svelte";
  import Icon from "@iconify/svelte";
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
  $: console.log(smallList);
</script>

{#if currentCameras.length > 0}
  <div class="flex-grow border-l overflow-y-auto">
    <section class="border-b w-full p-2 px-4">
      <div
        class={`flex ${smallList && "flex-col space-y-2"} justify-between items-center`}
      >
        <h2 class="text-base font-semibold">Cameras</h2>
        <div
          class={cn(
            "flex items-center",
            smallList ? "justify-between w-full" : "space-x-0"
          )}
        >
          <AddCameraModal
            >{#if !smallList}<GhostIconButton>
                <Icon
                  icon="mdi:add-circle-outline"
                  width={20}
                  class="dark:text-white"
                />
              </GhostIconButton>
            {:else}
              <Button variant="outline" size="sm" class="text-xs">Add</Button>
            {/if}</AddCameraModal
          >

          {#if !smallList}<GhostIconButton>
              <Icon
                icon="material-symbols:edit-square-outline"
                width={20}
                class="dark:text-white"
              />
            </GhostIconButton>{:else}
            <Button variant="outline" size="sm" class="text-xs dark:text-white"
              >Edit</Button
            >
          {/if}

          {#if !smallList}<GhostIconButton>
              <Icon
                icon="mdi:trash-outline"
                width={20}
                class="dark:text-white"
              />
            </GhostIconButton>{:else}
            <Button variant="outline" size="sm" class="text-xs dark:text-white"
              >Delete</Button
            >{/if}
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
            <p class={`text-xs w-full ${smallList ? "hidden" : "text-clip "}`}>
              {camera.url?.split("@")?.[1]?.split("/")?.[0]?.split(":")?.[0]}
            </p>
          </div>

          <ul
            class={`flex flex-row gap-0 ${!smallList && "xl:ml-auto"} p-0 list-none cursor-pointer`}
          >
            <li class="cursor-pointer">
              <GhostIconButton>
                <Icon
                  icon="material-symbols:edit-square-outline"
                  width={14}
                  class="dark:text-white p-0"
                />
              </GhostIconButton>
            </li>
            <li class="cursor-pointer">
              <GhostIconButton>
                <Icon icon="mdi:settings" width={14} class="dark:text-white" />
              </GhostIconButton>
            </li>
            <li class="cursor-pointer">
              <GhostIconButton>
                <Icon
                  icon="mdi:trash-outline"
                  width={14}
                  class="dark:text-white"
                />
              </GhostIconButton>
            </li>
          </ul>
        </article>
      {/each}
    </div>
  </div>
{/if}
