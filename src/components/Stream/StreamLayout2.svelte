<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import AddNode from "@/components/Nodes/AddNode.svelte";
  import StreamTile from "./StreamTile2.svelte";
  import { cameras, selectedLayout } from "@/stores";
  import { dndzone } from "svelte-dnd-action";
  import VideoRTCStream from "./Streamer.svelte";

  import ChevronLeft from "svelte-radix/ChevronLeft.svelte";
  import ChevronRight from "svelte-radix/ChevronRight.svelte";
  import * as Pagination from "@/components/ui/pagination/index.js";

  // let currentCameras = [];

  // export let cameras = [];
  export let shouldUpdateContainer = false;
  export let layout = 0;

  let currentPage = 0;
  let pageSize = 9;

  // $: currentCameras =
  //   false && $cameras.length > 0 && layout > 0 && layout <= 6
  //     ? $cameras.slice(0, layout * layout)
  //     : $cameras;

  $: currentCameras = $cameras.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  let container;
  let gridItems = [];
  let columns = 1,
    rows = 1;
  $: ({ columns, rows } = calculateLayout(currentCameras.length));

  function calculateLayout(count) {
    if (count <= 2) return { columns: count, rows: 1 };
    if (count <= 4) return { columns: 2, rows: 2 };
    if (count <= 6) return { columns: 3, rows: 2 };
    if (count <= 9) return { columns: 3, rows: 3 };
    if (count <= 12) return { columns: 3, rows: 4 };
    if (count <= 16) return { columns: 4, rows: 4 };
    if (count <= 20) return { columns: 4, rows: 5 };
    if (count <= 25) return { columns: 5, rows: 5 };
    if (count <= 30) return { columns: 5, rows: 6 };
    if (count <= 36) return { columns: 6, rows: 6 };
    return { columns: 3, rows: Math.ceil(count / 3) };
  }

  function updateLayout() {
    if (!container || currentCameras.length === 0) return;
    if (layout > 0 && layout <= 6) {
      columns = rows = layout;
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const aspectRatio = 16 / 9;
    // const aspectRatio = 4 / 4;
    let gap = 8; // Gap between items

    let itemWidth = (containerWidth - (columns + 1) * gap) / columns;
    let itemHeight = itemWidth / aspectRatio;

    // gap =
    //   gap +
    //   (containerWidth - (columns * itemWidth + gap * (columns - 1))) /
    //     (columns - 1);

    itemWidth = (containerWidth - (columns + 1) * gap) / columns;
    itemHeight = itemWidth / aspectRatio;

    // Adjust height if it exceeds container height
    const totalHeight = rows * itemHeight + (rows + 1) * gap;
    if (totalHeight > containerHeight) {
      itemHeight = (containerHeight - (rows + 1) * gap) / rows;
      itemWidth = itemHeight * aspectRatio;
    }

    let vgap =
      (gap +
        (containerWidth - (columns * itemWidth + gap * (columns - 1))) /
          (columns - 1)) /
      2;

    const lastRowColumns = currentCameras.length % columns || columns;
    const lastRowWidth =
      (containerWidth - (lastRowColumns + 1) * vgap) / lastRowColumns;
    const lastRowHeight = lastRowWidth / aspectRatio;

    gridItems.forEach((item, index) => {
      let width, height, top, left;
      const row = Math.floor(index / columns);
      const col = index % columns;

      if (row < rows - 1 || currentCameras.length % columns === 0) {
        // Regular grid items
        width = itemWidth;
        height = itemHeight;
        top = row * (itemHeight + gap) + gap;
        left = col * (itemWidth + vgap) + vgap;
      } else {
        // Last row items for odd number of currentCameras
        width = lastRowWidth;
        height = lastRowHeight;
        top = (rows - 1) * (itemHeight + gap) + gap;
        left = (col % lastRowColumns) * (lastRowWidth + vgap) + vgap;
      }

      item.style.width = `${width}px`;
      item.style.height = `${height}px`;
      item.style.top = `${top}px`;
      item.style.left = `${left}px`;
    });
  }

  function updateGridItems() {
    if (container) {
      gridItems = Array.from(container.querySelectorAll(".grid-item"));
      updateLayout();
    }
  }

  function nextPage() {
    if ((currentPage + 1) * pageSize < $cameras.length) {
      currentPage++;
    }
  }

  function goToPage(page: number) {
    currentPage = page - 1;
  }

  function prevPage() {
    if (currentPage > 0) {
      currentPage--;
    }
  }

  onMount(() => {
    updateGridItems();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  });

  afterUpdate(() => {
    updateGridItems();
  });
  $: if (shouldUpdateContainer) {
    updateGridItems();
    // Reset the flag after updating
    shouldUpdateContainer = false;
  }
  $: {
    currentCameras;
    if (container) {
      setTimeout(updateGridItems, 0);
    }
  }

  function handleReorder({ detail: { items } }) {
    currentCameras = items.map((item) => ({ ...item }));
  }

  function fullscreenStream(streamId) {
    const streamElement = document.getElementById(`stream-${streamId}`);
    // const videoElement = streamElement.querySelector("lens-view-stream-tile");
    // streamElement.switchToHighQuality();
    const stream = currentCameras.find((c) => c.id === streamId);
    if (streamElement && stream) {
      console.log("Data url:", stream.url);
      streamElement.setAttribute(
        "data-url",
        `ws://localhost:8080/api/ws?src=${stream.id}_FULL`
      );
    }
    if (streamElement.requestFullscreen) {
      streamElement.requestFullscreen({ navigationUI: "show" });
      document.addEventListener(
        "fullscreenchange",
        function handleFullscreenChange() {
          if (!document.fullscreenElement && stream?.subUrl) {
            // Reset the data-url when exiting fullscreen
            streamElement.setAttribute(
              "data-url",
              `ws://localhost:8080/api/ws?src=${stream.id}`
            );
            console.log(
              "Exited fullscreen, resetting data-url:",
              `ws://localhost:8080/api/ws?src=${stream.id}`
            );

            // Remove the event listener after fullscreen change is handled
            document.removeEventListener(
              "fullscreenchange",
              handleFullscreenChange
            );
          }
        }
      );
    }
  }
  $: console.log(currentCameras);
</script>

{#if currentCameras.length > 0}
  <div class="layout-container" bind:this={container}>
    {#each currentCameras as stream (stream.id)}
      {#key stream.id}
        <div
          class={`grid-item rounded-lg relative group`}
          style="transition: transform 0.3s;"
        >
          <StreamTile
            url={stream.subUrl
              ? `ws://localhost:8080/api/ws?src=${stream.id}`
              : `ws://localhost:8080/api/ws?src=${stream.id}_FULL`}
            classes=""
            id={stream.id}
          />
          <!-- <VideoRTCStream
            url={stream.subUrl
              ? `ws://localhost:8080/api/ws?src=${stream.id}`
              : `ws://localhost:8080/api/ws?src=${stream.id}_FULL`}
            classes=""
            id={stream.id}
          /> -->
          <button
            class="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            on:click={() => fullscreenStream(stream.id)}
          >
            Fullscreen</button
          >
        </div>
      {/key}
    {/each}
  </div>
  <Pagination.Root
    count={$cameras.length}
    perPage={pageSize}
    siblingCount={1}
    let:pages
    let:currentPage
  >
    <Pagination.Content class="mt-2">
      <Pagination.Item>
        <Pagination.PrevButton on:click={prevPage} disabled={currentPage === 1}>
          <ChevronLeft class="h-4 w-4" />
          <span class="hidden sm:block">Previous</span>
        </Pagination.PrevButton>
      </Pagination.Item>
      {#each pages as page (page.key)}
        {#if page.type === "ellipsis"}
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
        {:else}
          <Pagination.Item>
            <Pagination.Link
              {page}
              isActive={currentPage === page.value}
              on:click={goToPage(page.value)}
            >
              {page.value}
            </Pagination.Link>
          </Pagination.Item>
        {/if}
      {/each}
      <Pagination.Item>
        <Pagination.NextButton
          on:click={nextPage}
          disabled={currentPage * pageSize >= $cameras.length}
        >
          <span class="hidden sm:block">Next</span>
          <ChevronRight class="h-4 w-4" />
        </Pagination.NextButton>
      </Pagination.Item>
    </Pagination.Content>
  </Pagination.Root>
{/if}

<style>
  .layout-container {
    position: relative;
    /* width: 75vw; */
    height: calc(100vh - 7rem);
    overflow: hidden;
  }

  .grid-item {
    position: absolute;
    /* background-color: #f0f0f0; */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #333;
  }

  .dragging {
    opacity: 0.7;
    transform: scale(1.05);
  }
</style>
