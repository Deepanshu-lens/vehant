<script lang="ts">
  import { onMount } from "svelte";
  import { cameras } from "@/stores/store";
  import Sortable from "sortablejs";
  import GhostIconButton from "@/components/ui/custom/GhostIconButton.svelte";
  import AddCameraModal from "@/components/ui/modal/AddCameraModal.svelte";
  import Icon from "@iconify/svelte";
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
</script>

<div class="flex-grow bg-white border-l overflow-y-auto">
  <section class="border-b w-full p-2 px-4">
    <div class="flex justify-between items-center">
      <h2 class="text-base font-semibold">Cameras</h2>
      <div class="flex items-center space-x-0">
        <AddCameraModal
          ><GhostIconButton>
            <Icon icon="mdi:add-circle-outline" width={20} />
          </GhostIconButton></AddCameraModal
        >

        <GhostIconButton>
          <Icon icon="material-symbols:edit-square-outline" width={20} />
        </GhostIconButton>

        <GhostIconButton>
          <Icon icon="mdi:trash-outline" width={20} />
        </GhostIconButton>
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
        class={`flex  items-center gap-4 p-4 dark:border 
              hover:border hover:border-primary 
              rounded-xl shadow-md text-sm z-10 w-full px-4
          `}
      >
        <Icon
          icon="material-symbols:menu"
          class="h-4 w-4 cursor-grab flex-shrink-0 my-handle"
        />
        <div class="grid gap-1">
          <span class="flex items-center gap-2">
            <h3 class="text-sm font-medium whitespace-nowrap">
              {camera.name?.length > 11
                ? name?.substring(0, 10) + "..."
                : camera.name}
            </h3>
          </span>
          <p class="text-xs">
            {camera.url?.split("@")?.[1]?.split("/")?.[0]?.split(":")?.[0]}
          </p>
        </div>

        <ul class="flex flex-row gap-0 xl:ml-auto p-0 list-none cursor-pointer">
          <li class="cursor-pointer">
            <GhostIconButton>
              <Icon icon="material-symbols:edit-square-outline" width={20} />
            </GhostIconButton>
          </li>
          <li class="cursor-pointer">
            <GhostIconButton>
              <Icon icon="mdi:settings" width={20} />
            </GhostIconButton>
          </li>
          <li class="cursor-pointer">
            <GhostIconButton>
              <Icon icon="mdi:trash-outline" width={20} />
            </GhostIconButton>
          </li>
        </ul>
      </article>
    {/each}
  </div>
</div>
