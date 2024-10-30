<script lang="ts">
  import * as Select from "@/components/ui/select";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Switch } from "@/components/ui/switch";
  import { Toggle } from "@/components/ui/toggle";
  import * as Tabs from "@/components/ui/tabs";
  import { Slider } from "@/components/ui/slider";
  import { cameraSchema } from "@/types";

  import pb from "@/lib/sharedPB";
  import { selectedNode } from "@/stores";

  import { createForm } from "felte";
  import { validator } from "@felte/validator-zod";

  export let cameraName = "";
  export let mainUrl = "";
  export let subUrl = "";
  export let doneSubmit = false;

  // const validator = ({ schema }) => ({
  //   validate: (values) => {
  //     const result = schema.safeParse(values);
  //     console.log("re", result);
  //     if (result.success) {
  //       // If validation passed, return an empty object (no errors)
  //       return {};
  //     } else {
  //       // If validation failed, map the errors to return them in the expected format
  //       return result.error.format();
  //     }
  //   },
  // });

  const { form, errors, reset, isSubmitting } = createForm({
    initialValues: { name: "", url: "", subUrl: "" },
    // extend: validator({ schema: cameraSchema }),
    extend: validator({ schema: cameraSchema.schema.omit({ id: true }) }),
    onSubmit: async (values) => {
      console.log(cameraSchema.schema.omit({ id: true }).safeParse(values));
      console.log("Form submitted with:", values);
      addCamera();
      // const response = await login(values.email, values.password);
      // if (!response) {
      //   reset();
      //   return;
      // }
      // if (window.api) {
      //   window.api.navigate("/index");
      // } else {
      //   window.location.href = "/";
      // }
    },
    onError: (err) => {
      console.error("Form validation failed:", err);
    },
  });

  const addCamera = async () => {
    try {
      // Create the camera record in Pocketbase
      const data = {
        name: cameraName,
        url: mainUrl,
        subUrl,
        motionSensitivity: 33, // Example value
        node: $selectedNode,
      };

      // Push the data to Pocketbase (to the 'cameras' collection, for example)
      const record = await pb.collection("camera").create(data);
      console.log("Camera added:", record);
      doneSubmit = true;
    } catch (error) {
      console.error("Failed to add camera:", error);
    }
  };
</script>

<form use:form class="space-y-4 mt-4">
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
    <div class="w-full">
      <Input
        type="text"
        name="name"
        placeholder="Home-Garage"
        class=""
        bind:value={cameraName}
      />
      <div class="text-rose-500 text-xs pt-2">
        {#if $errors.name}
          {$errors.name}
        {/if}
      </div>
    </div>
  </div>

  <Tabs.Root value="url">
    <Tabs.List class="grid w-full grid-cols-2">
      <Tabs.Trigger value="url">Using URL</Tabs.Trigger>
      <Tabs.Trigger value="details">Using Details</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="url" class="py-2">
      <div class="flex items-center justify-between pb-4">
        <Label>Main URL</Label>
        <div class="w-full">
          <Input
            type="text"
            name="url"
            placeholder="rtsp://admin:password@123.123.123.123/stream/1"
            class="text-xs"
            bind:value={mainUrl}
          />
          <div class="text-rose-500 text-xs pt-2">
            {#if $errors.url}
              {$errors.url}
            {/if}
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between pb-4">
        <Label>Sub URL</Label>
        <div class="w-full">
          <Input
            type="text"
            name="subUrl"
            placeholder="rtsp://admin:password@123.123.123.123/stream/2"
            class=" text-xs"
            bind:value={subUrl}
          />
          <div class="text-rose-500 text-xs pt-2">
            {#if $errors.subUrl}
              {$errors.subUrl}
            {/if}
          </div>
        </div>
      </div>
    </Tabs.Content>
    <Tabs.Content value="details">Change your password here.</Tabs.Content>
  </Tabs.Root>

  <div class="flex flex-col items-start justify-between pb-4 w-full">
    <Label>Features</Label>
    <div class="flex items-center justify-between py-4 space-x-4">
      <div class="flex items-center space-x-1">
        <Switch id="feedSaving" />
        <Label for="feedSaving" class="text-xs font-normal">Feed Saving</Label>
      </div>

      <div class="flex items-center space-x-1">
        <Switch id="vehicleScan" />
        <Label for="vehicleScan" class="text-xs font-normal">Vehicle Scan</Label
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
  <!-- <button
    disabled={$isSubmitting}
    class="bg-[#015A62] hover:bg-[#015A62]/[.4] text-white font-bold py-2 px-4 rounded-md w-full focus:outline-none focus:shadow-outline"
    type="submit"
  >
    {#if $isSubmitting}
      Submitting ...
    {:else}
      Sign In
    {/if}
  </button> -->
  <div class="flex flex-1 flex-col mx-auto">
    <Button type="submit" class="bg-[#015A62] text-white font-semibold"
      >Confirm</Button
    >
  </div>
</form>
