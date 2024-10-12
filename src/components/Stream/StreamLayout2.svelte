<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import StreamTile from "./StreamTile.svelte";

  export let cameras: Camera[] = [];
  let currentCameras = cameras;

  $: currentCameras =
    false && cameras.length > 0 && layout > 0 && layout <= 6
      ? cameras.slice(0, layout * layout)
      : cameras;

  $: console.log("current cameras: ", currentCameras);

  export let layout = 0;

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
    const gap = 8; // Gap between items

    let itemWidth = (containerWidth - (columns + 1) * gap) / columns;
    let itemHeight = itemWidth / aspectRatio;

    // Adjust height if it exceeds container height
    const totalHeight = rows * itemHeight + (rows + 1) * gap;
    if (totalHeight > containerHeight) {
      itemHeight = (containerHeight - (rows + 1) * gap) / rows;
      itemWidth = itemHeight * aspectRatio;
    }

    const lastRowColumns = currentCameras.length % columns || columns;
    const lastRowWidth =
      (containerWidth - (lastRowColumns + 1) * gap) / lastRowColumns;
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
        left = col * (itemWidth + gap) + gap;
      } else {
        // Last row items for odd number of currentCameras
        width = lastRowWidth;
        height = lastRowHeight;
        top = (rows - 1) * (itemHeight + gap) + gap;
        left = (col % lastRowColumns) * (lastRowWidth + gap) + gap;
      }

      item.style.width = `${width}px`;
      item.style.height = `${height}px`;
      item.style.top = `${top}px`;
      item.style.left = `${left}px`;
    });
  }

  function updateGridItems() {
    gridItems = Array.from(container.querySelectorAll(".grid-item"));
    updateLayout();
  }

  onMount(() => {
    updateGridItems();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  });

  afterUpdate(() => {
    updateGridItems();
  });
  $: {
    currentCameras;
    if (container) {
      setTimeout(updateGridItems, 0);
    }
  }
</script>

<div class="layout-container" bind:this={container}>
  {#each currentCameras as stream, i}
    <div class="grid-item rounded-lg">
      <StreamTile
        url={`ws://localhost:8080/api/ws?src=${stream.id}_FULL`}
        classes=""
      />
    </div>
  {/each}
</div>

<style>
  .layout-container {
    position: relative;
    width: 75vw;
    height: calc(100vh - 5rem);
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
</style>
