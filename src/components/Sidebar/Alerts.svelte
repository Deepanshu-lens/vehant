<script lang="ts">
  import Icon from "@iconify/svelte";
  import GhostIconButton from "@/components/ui/custom/GhostIconButton.svelte";
  export let smallList;
  let alerts = [];
</script>

<div class="flex-grow border-l overflow-y-auto w-full">
  <section class="border-b w-full p-2 px-4">
    <div
      class={`flex ${smallList && "flex-col space-y-2"} justify-between items-center`}
    >
      Alerts
      <GhostIconButton>
        <Icon
          icon="material-symbols:filter-alt"
          width={20}
          class="dark:text-white"
        />
      </GhostIconButton>
    </div>
  </section>
  <div
    id="camera-items"
    class={`flex flex-col gap-4 w-full max-w-screen-md mx-auto max-h-[calc(100vh-3rem)] overflow-y-auto overflow-x-clip
                  transition-all duration-100 fade-in-0
                  p-4 
                  rounded-lg`}
  >
    {#if alerts.length > 0}
      Alerts here{:else}
      No alerts found.
    {/if}
  </div>
</div>
