<script lang="ts">
  import { onMount } from "svelte";
  import pb from "@/lib/sharedPB";
  import * as Resizable from "@/components/ui/resizable";
  import CameraList from "@/components/Sidebar/CameraList.svelte";
  import QuickActions from "@/components/Sidebar/QuickActions.svelte";
  import { PaneResizer, type PaneAPI } from "paneforge";
  import StreamLayout from "@/components/Stream/StreamLayout2.svelte";
  import { selectedNode, nodes, user } from "@/stores";

  let collapsed = false;
  let paneOne: PaneAPI;
  let smallList = false;

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
      maxSize={50}
      defaultSize={22}
      bind:pane={paneOne}
      collapsible={true}
      collapsedSize={0}
      minSize={0}
      onExpand={() => (isCollapsed = false)}
      onResize={(e) => {
        if (e < 10) {
          // Threshold for easier expansion
          paneOne.collapse();
        }
        shouldUpdateContainer = true;
      }}
    >
      <!-- <div class="flex"> -->
      <CameraList {smallList} />
      <!-- <QuickActions /> -->
      <!-- </div> -->
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
      <button
        class="flex max-w-[160px] hover:bg-[#015a62]/[.9] dark:bg-transparent bg-[#015a62] border-2 border-white border-solid dark:hover:bg-[white] dark:hover:text-[#015a62] text-md text-white items-center justify-center py-2 px-6 font-medium rounded-lg"
        type="submit"
        on:click={addNode}
      >
        Add Node
      </button>
    </form>
  </div>
{/if}
