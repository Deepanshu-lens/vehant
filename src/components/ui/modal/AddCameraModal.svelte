<script lang="ts">
  import { Button } from "@/components/ui/button";
  import * as Dialog from "@/components/ui/dialog";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Switch } from "@/components/ui/switch";
  import { Toggle } from "@/components/ui/toggle";
  import * as Tabs from "@/components/ui/tabs";
  import { Slider } from "@/components/ui/slider";
  import * as Select from "@/components/ui/select";

  import PocketBase from "pocketbase";

  let modalOpen = false;
  let cameraName = "";
  let mainUrl = "";
  let subUrl = "";

  const pb = new PocketBase("http://localhost:8090/");

  async function addCamera() {
    try {
      // Create the camera record in Pocketbase
      const data = {
        name: cameraName,
        mainUrl,
        url: subUrl,
        motionSensitivity: 33, // Example value
      };

      console.log(data);

      // Push the data to Pocketbase (to the 'cameras' collection, for example)
      const record = await pb.collection("camera").create(data);
      console.log("Camera added:", record);
      modalOpen = false;
    } catch (error) {
      console.error("Failed to add camera:", error);
    }
  }
</script>

<Dialog.Root bind:open={modalOpen}>
  <Dialog.Trigger><slot /></Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="border-b pb-4">Add Camera</Dialog.Title>
    </Dialog.Header>
    <form class="space-y-4 mt-4">
      <!-- Manual/Automatic Mode -->
      <div class="flex items-center justify-between border-b pb-8">
        <Label>Select method of adding camera</Label>
        <Select.Root>
          <Select.Trigger class="w-24">
            <Select.Value placeholder="Manual" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="manual">Manual</Select.Item>
            <Select.Item value="automatic">Automatic</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <!-- Single/Bulk Upload -->
      <div class="flex items-center justify-between pb-4">
        <Label>Insert a new camera to node</Label>
        <div class="flex items-center space-x-2">
          <Label for="single" class="text-xs font-normal">Single Upload</Label>
          <Switch id="bulk" />
          <Label for="bulk" class="text-xs font-normal">Bulk Upload</Label>
        </div>
      </div>

      <!-- Camera Name -->
      <!-- rtsp://admin@admin:123.123.123.0/ch01 -->
      <div class="flex items-center justify-between pb-4">
        <Label>Camera Name</Label>
        <Input
          type="text"
          placeholder="Home-Garage"
          class="max-w-xs"
          bind:value={cameraName}
        />
      </div>
    </form>

    <Tabs.Root value="url">
      <Tabs.List class="grid w-full grid-cols-2">
        <Tabs.Trigger value="url">Using URL</Tabs.Trigger>
        <Tabs.Trigger value="details">Using Details</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="url" class="py-2">
        <div class="flex items-center justify-between pb-4">
          <Label>Main URL</Label>
          <Input
            type="text"
            placeholder="rtsp://admin:password@123.123.123.123/stream/1"
            class="max-w-xs text-xs"
            bind:value={mainUrl}
          />
        </div>
        <div class="flex items-center justify-between pb-4">
          <Label>Sub URL</Label>
          <Input
            type="text"
            placeholder="rtsp://admin:password@123.123.123.123/stream/2"
            class="max-w-xs text-xs"
            bind:value={subUrl}
          />
        </div>
      </Tabs.Content>
      <Tabs.Content value="details">Change your password here.</Tabs.Content>
    </Tabs.Root>

    <div class="flex flex-col items-start justify-between pb-4 w-full">
      <Label>Features</Label>
      <div class="flex items-center justify-between py-4 space-x-4">
        <div class="flex items-center space-x-1">
          <Switch id="feedSaving" />
          <Label for="feedSaving" class="text-xs font-normal">Feed Saving</Label
          >
        </div>

        <div class="flex items-center space-x-1">
          <Switch id="vehicleScan" />
          <Label for="vehicleScan" class="text-xs font-normal"
            >Vehicle Scan</Label
          >
        </div>

        <div class="flex items-center space-x-1">
          <Switch id="faceScan" />
          <Label for="faceScan" class="text-xs font-normal">Face Scan</Label>
        </div>

        <div class="flex items-center space-x-2">
          <Switch id="priority" />
          <Label for="priority" class="text-xs font-normal">Priority</Label>
        </div>
      </div>
      <div class="flex items-center justify-between pb-4 w-full space-x-12">
        <Label>Motion Sensitivity</Label>
        <Slider value={[33]} max={100} step={1} />
      </div>
    </div>

    <Dialog.Footer class="flex flex-1 flex-col mx-auto">
      <Button type="submit" class="bg-[#015A62]" on:click={() => addCamera()}
        >Confirm</Button
      >
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
