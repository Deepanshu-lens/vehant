<script lang="ts">
  import { onMount } from "svelte";
  import pb from "@/lib/sharedPB";
  import Icon from "@iconify/svelte";
  import { isAlertPanelOpen } from "@/stores";
  import * as Resizable from "@/components/ui/resizable";
  import { Button } from "@/components/ui/button";
  import CameraList from "@/components/Sidebar/CameraList.svelte";
  import Alerts from "@/components/Sidebar/Alerts.svelte";
  import QuickActions from "@/components/Sidebar/QuickActions.svelte";
  import { PaneResizer, type PaneAPI } from "paneforge";
  import StreamLayout from "@/components/Stream/StreamLayout2.svelte";
  import { selectedNode, nodes, user } from "@/stores";

  $: console.log("Alter: ", $isAlertPanelOpen);

  let collapsed = false;
  let paneOne: PaneAPI;
  let smallList = false;
  let currentPanel = 0;

  let nodeName = "";
  const addNode = async () => {
    const data = {
      name: nodeName,
      session: $user.session[0],
    };
    const record = await pb.collection("node").create(data);
    selectedNode.set(record.id);
  };
  let shouldUpdateContainer = false;
  $: console.log("SelectedNode: ", $selectedNode);
  let isCollapsed = false;
</script>

{#if $nodes.length > 0}
  <Resizable.PaneGroup
    direction="horizontal"
    autoSaveId="LENSViewPaneSize"
    style="height: calc(100vh - 3rem);"
  >
    <Resizable.Pane default={70}
      ><StreamLayout bind:shouldUpdateContainer /></Resizable.Pane
    >
    <Resizable.Handle withHandle />
    <Resizable.Pane
      style={`${!isCollapsed ? "overflow: visible;" : "overflow: hidden;"}`}
      maxSize={50}
      defaultSize={22}
      bind:pane={paneOne}
      collapsible={true}
      collapsedSize={0}
      minSize={0}
      onResize={(e) => {
        if (e < 10) {
          // Threshold for easier expansion
          isCollapsed = true;
          paneOne.collapse();
        } else {
          isCollapsed = false;
          paneOne.expand();
        }
        shouldUpdateContainer = true;
      }}
    >
      <div class="relative">
        {#if currentPanel == 0}
          <CameraList {smallList} />
        {:else if currentPanel == 1}
          <Alerts />
        {/if}
        {#if $isAlertPanelOpen}
          <div
            class="absolute z-30 -translate-x-full top-44 transform -left-8 transition-all duration-500 ease-in-out"
          >
            <div class="-rotate-90 flex items-center origin-top-right">
              <div
                class={`${currentPanel == 0 ? "text-bold bg-background" : "bg-background/80 "} cursor-pointer h-[32px] rounded-t-xl  text-black dark:text-white px-3 flex items-center whitespace-nowrap shadow-xl z-40 border dark:border-muted-foreground/10`}
              >
                <div
                  class="flex items-center justify-center place-items-center my-auto space-x-2"
                  on:click={() => (currentPanel = 0)}
                >
                  <span>Cameras</span>
                  <button
                    class={`text-center items-center flex place-items-center hover:bg-foreground/50 hover:dark:text-black hover:text-white rounded-full hover:m-1`}
                    on:click={() => isAlertPanelOpen.set(false)}
                  >
                    <Icon icon="material-symbols:close-rounded" width={14} />
                  </button>
                </div>
              </div>
              <div
                class={`${currentPanel == 1 ? "text-bold bg-background" : "bg-background/80 "} cursor-pointer h-[32px] rounded-t-xl  text-black dark:text-white px-3 flex items-center whitespace-nowrap shadow-xl z-40 border dark:border-muted-foreground/10`}
              >
                <div
                  class="flex items-center justify-center place-items-center my-auto space-x-2"
                  on:click={() => (currentPanel = 1)}
                >
                  <span>Alerts</span>
                  <button
                    class={`text-center items-center flex place-items-center hover:bg-foreground/50 hover:dark:text-black hover:text-white rounded-full hover:m-1`}
                    on:click={() => isAlertPanelOpen.set(false)}
                  >
                    <Icon icon="material-symbols:close-rounded" width={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </Resizable.Pane>
    <div style="width: auto;">
      <QuickActions />
    </div>
  </Resizable.PaneGroup>
{:else}
  <div
    class="
    flex
    flex-col
    items-start
    justify-center h-screen w-screen
    dark:bg-dark-add-node
    bg-no-repeat
    pl-32
    bg-light-add-node
    bg-contain
    bg-right
    dark:bg-cover"
  >
    <form
      on:submit={(e) => e.preventDefault()}
      method="POST"
      class="flex flex-col"
    >
      <label for="nodeName" class="font-medium text-start self-start mb-2">
        Node name
      </label>
      <input
        name="name"
        required
        bind:value={nodeName}
        class="w-[480px] text-black dark:text-white dark:bg-background bg-transparent font-medium px-4 h-[48px] rounded-md border-2 border-solid border-[#015a62] dark:border-none mb-6"
      />
      <Button
        variant="brand"
        class="flex max-w-[160px] hover:bg-[#015a62]/[.9] dark:bg-transparent bg-[#015a62] border-2 border-white border-solid dark:hover:bg-[white] dark:hover:text-[#015a62] text-md text-white items-center justify-center py-2 px-6 font-medium rounded-lg"
        type="submit"
        on:click={addNode}
      >
        Add Node
      </Button>
    </form>
  </div>
{/if}
