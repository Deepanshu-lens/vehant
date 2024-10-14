<script lang="ts">
  import { onMount } from "svelte";
  import pb from "@/lib/sharedPB";
  import { cameras } from "@/stores";
  import type { Camera } from "@/types";
  import * as Resizable from "@/components/ui/resizable";
  import { validateCamera } from "@/validateSchema";
  import CameraList from "@/components/Sidebar/CameraList.svelte";
  import QuickActions from "@/components/Sidebar/QuickActions.svelte";
  import { PaneResizer, type PaneAPI } from "paneforge";
  import StreamLayout from "@/components/Stream/StreamLayout2.svelte";

  (async () => {
    try {
      const localCameras = await pb.collection("camera").getFullList<Camera>({
        fields: "id,name,url",
      });
      cameras.set(localCameras);
    } catch (error) {
      console.error("Error initializing Camera Manager:", error);
    }
  })();

  try {
    pb.collection("camera").subscribe("*", (e) => {
      console.log("Camera collection updated", e.action, e.record);
      if (e.action === "create") {
        const validated = validateCamera(e.record);
        if (validated) cameras.update((current) => [...current, validated]);
      } else if (e.action === "update") {
        const validated = validateCamera(e.record);
        if (validated)
          cameras.update((current) =>
            current.map((cam) => (cam.id === validated.id ? validated : cam))
          );
      } else if (e.action === "delete") {
        cameras.update((current) =>
          current.filter((cam) => cam.id !== e.record.id)
        );
      }
    });
  } catch (error) {
    console.error("Failed realtime camera");
  }

  let collapsed = false;
  let paneOne: PaneAPI;
  let smallList = false;
</script>

<Resizable.PaneGroup
  direction="horizontal"
  autoSaveId="LENSViewPaneSize"
  style="height: calc(100vh - 3rem);"
>
  <Resizable.Pane default={70}><StreamLayout /></Resizable.Pane>
  <Resizable.Handle withHandle />
  <Resizable.Pane
    maxSize={22}
    bind:pane={paneOne}
    collapsible={true}
    collapsedSize={4}
    minSize={0}
    onResize={(e) => {
      if (e < 17.5) {
        smallList = true;
      } else {
        smallList = false;
      }
      if (e < 14) {
        paneOne.collapse();
      }
    }}
  >
    <div class="flex">
      <CameraList {smallList} /><QuickActions />
    </div></Resizable.Pane
  >
</Resizable.PaneGroup>
