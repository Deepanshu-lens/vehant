<script lang="ts">
  import StreamTile from "./StreamTile.svelte";

  export let cameras: Camera[] = [];
  export let layout = "auto"; // Default layout

  let streamCount = cameras.length;
  let layoutRows = 1;
  let layoutColumns = 1;
  let totalPages = 1;

  console.log(cameras);

  function calculateAutoLayout(streamCount) {
    if (streamCount === 0) {
      return;
    }
    if (streamCount === 1) {
      layoutColumns = 1;
      layoutRows = 1;
    } else if (streamCount === 2) {
      layoutColumns = 2;
      layoutRows = 1;
    } else if (streamCount === 3) {
      layoutColumns = 2;
      layoutRows = 2;
    } else if (streamCount === 4) {
      layoutColumns = 2;
      layoutRows = 2;
    } else if (streamCount === 5) {
      layoutColumns = 3;
      layoutRows = 2; // One row with 2 streams, one row with 3 streams
    } else if (streamCount === 6) {
      layoutColumns = 3;
      layoutRows = 2;
    } else if (streamCount === 7) {
      layoutColumns = 3;
      layoutRows = 3;
    } else if (streamCount === 8) {
      layoutColumns = 3;
      layoutRows = 3; // Adjust for one extra stream
    } else if (streamCount === 9) {
      layoutColumns = 3;
      layoutRows = 3; // Perfect square
    } else if (streamCount === 10) {
      layoutColumns = 4;
      layoutRows = 3; // One row with 4 streams, rest with 3 streams
    } else {
      const squareRoot = Math.floor(Math.sqrt(streamCount));
      layoutColumns = squareRoot;
      layoutRows = Math.ceil(streamCount / layoutColumns);
    }
  }

  function getGridTemplate(layout) {
    switch (layout) {
      case "5x5":
        return "grid-cols-5 grid-rows-5";
      case "4x4":
        return "grid-cols-4 grid-rows-4";
      case "3x3":
        return "grid-cols-3 grid-rows-3";
      case "2x2":
        return "grid-cols-2 grid-rows-2";
      case "1+5":
        // Custom layout logic here
        break;
      case "1+7":
        // Custom layout logic here
        break;
      default:
        console.log("TOTOTOTOTOTOTO", streamCount);
        calculateAutoLayout(streamCount);
        break; // Default
    }
  }

  function getGridTemplateStyles() {
    if (streamCount === 3) {
      return "grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr);";
    } else if (streamCount === 5) {
      return "grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(2, 1fr);";
    } else if (streamCount === 7) {
      return "grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);";
    } else if (streamCount === 9) {
      return "grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);";
    } else {
      return `grid-template-columns: repeat(${layoutColumns}, 1fr); grid-template-rows: repeat(${layoutRows}, 1fr);`;
    }
  }

  // let dynamicGap = 16;

  // // Calculate available space and adjust gap dynamically to fit within bounds
  // function calculateDynamicGap() {
  //   const availableWidth = window.innerWidth * 0.75; // 75% width
  //   const availableHeight = window.innerHeight - 3 * 16; // Subtract topbar height

  //   // Estimate the width and height of each tile while maintaining 16:9 aspect ratio
  //   const tileWidth = availableWidth / layoutColumns;
  //   const tileHeight = (tileWidth * 9) / 16;

  //   // If total grid height exceeds available height, reduce gap dynamically
  //   const totalGridHeight =
  //     tileHeight * layoutRows + (layoutRows - 1) * dynamicGap;

  //   if (totalGridHeight > availableHeight) {
  //     dynamicGap = Math.max(
  //       6,
  //       (availableHeight - tileHeight * layoutRows) / (layoutRows - 1)
  //     );
  //   } else {
  //     dynamicGap = 16; // Reset to default gap
  //   }
  //   console.log(
  //     tileWidth,
  //     tileHeight,
  //     window.innerHeight,
  //     (tileWidth * 9) / 16,
  //     totalGridHeight,
  //     dynamicGap
  //   );
  // }

  // // Generate grid layout styles with dynamic gap and aspect ratio consideration
  // function getGridTemplateStyles() {
  //   calculateDynamicGap();
  //   const rowHeight = `calc((100vw - ${dynamicGap * (layoutColumns - 1)}px) / ${layoutColumns} * 9 / 16)`;
  //   return `
  //     grid-template-columns: repeat(${layoutColumns}, 1fr);
  //     grid-template-rows: repeat(${layoutRows}, ${rowHeight});
  //     gap: ${dynamicGap}px;
  //   `;
  // }

  $: getGridTemplate(layout);
</script>

<main class="flex-grow" style="width: 75%; height: calc(100vh - 3rem);">
  <div class={`grid gap-4 w-full p-4 h-full`} style={getGridTemplateStyles()}>
    {#each cameras as camera, index}
      {#if streamCount === 3 && index === 2}
        <!-- Make the third stream span across the entire width -->
        <StreamTile
          url={`ws://localhost:8080/api/ws?src=${camera.id}`}
          classes="col-span-2 row-span-1 w-full"
        />
      {:else if streamCount === 5}
        {#if index > 2}
          <StreamTile
            url={`ws://localhost:8080/api/ws?src=${camera.id}`}
            classes="col-span-3 row-span-1 w-full"
          />
        {:else}
          <StreamTile
            url={`ws://localhost:8080/api/ws?src=${camera.id}`}
            classes=""
          />
        {/if}
      {:else if streamCount === 7}
        {#if index > 5}
          <StreamTile
            url={`ws://localhost:8080/api/ws?src=${camera.id}`}
            classes="col-span-3 row-span-1"
          />
        {:else}
          <StreamTile
            url={`ws://localhost:8080/api/ws?src=${camera.id}`}
            classes="col-span-1 row-span-1"
          />
        {/if}
      {:else}
        <StreamTile
          url={`ws://localhost:8080/api/ws?src=${camera.id}_FULL`}
          classes=""
        />
      {/if}
    {/each}
  </div>
</main>
