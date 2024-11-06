<script lang="ts">
  let dialogOpen = false;
  export let save: boolean;
  export let face: boolean;
  export let running: boolean;
  export let faceDetectionThreshold: number = 0.6;
  export let faceSearchThreshold: number = 0.3;
  export let runningDetectionThreshold: number = 0.75;
  export let saveDuration: number;
  export let saveFolder: string;
  export let motion: number = 1000;
  export let priority: boolean;
  export let intrusionDetection: boolean;
  export let intrusionPerson: boolean;
  export let intrusionVehicle: boolean;
  export let intrusionPersonThresh: number = 0.7;
  export let intrusionVehicleThresh: number = 0.7;
  export let lineCrossing: boolean;
  export let linePerson: boolean;
  export let lineVehicle: boolean;
  export let linePersonThresh: number = 0.7;
  export let lineVehicleThresh: number = 0.7;
  export let personCount: boolean;
  import * as Dialog from "@/components/ui/dialog";
  import { Label } from "@/components/ui/label";
  import { Switch } from "@/components/ui/switch";
  import { Input } from "@/components/ui/input";
  import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
  import * as Select from "@/components/ui/select";
  import { Slider } from "@/components/ui/slider";
  import { Button } from "@/components/ui/button";
  import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs";
  import {
    Activity,
    Construction,
    FileVideo2,
    FolderSearch,
    Footprints,
    Merge,
    PersonStanding,
    Pipette,
    ScanFace,
    Siren,
    ToggleLeftIcon,
  } from "lucide-svelte";
  const items = [
    {
      value: 30 * 24 * 60,
      label: "Every month",
    },
    {
      value: 7 * 24 * 60,
      label: "Every week",
    },
    {
      value: 24 * 60,
      label: "Every day",
    },
    {
      value: 60,
      label: "Every hour",
    },
    {
      value: 1,
      label: "Every minute",
    },
  ];
  let activeTab = "video-saving";
</script>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Trigger><slot /></Dialog.Trigger>
  <Dialog.Content class="sm:max-w-[800px] pl-0 pb-0 gap-0">
    <Dialog.Header class="border-b pb-2 pl-6 mb-0">
      <Dialog.Title>Camera Settings</Dialog.Title>
      <Dialog.Description>
        <!-- Change settings for <span class="font-semibold">{cameraName}</span> camera -->
      </Dialog.Description>
    </Dialog.Header>

    <!-- Dialog Content -->
    <div class="main-content mt-0">
      <Tabs
        value={activeTab}
        onValueChange={(value) => (activeTab = value)}
        class="w-full flex "
      >
        <!-- Right Side tabs -->
        <div class="h-[30rem] bg-neutral-100 dark:bg-black dark:text-white">
          <TabsList
            class="flex p-5 flex-col gap-y-4 justify-start items-start w-full mx-auto bg-[#F3F3F3]  dark:bg-black"
          >
            <TabsTrigger
              value="video-saving"
              class="w-full flex items-center justify-start dark:hover:bg-neutral-700"
            >
              <FileVideo2 size={16} class="mr-2" />Video Saving
            </TabsTrigger>
            <TabsTrigger
              value="face-scanning"
              class="w-full flex items-center justify-start dark:hover:bg-neutral-700"
            >
              <ScanFace size={16} class="mr-2" />Face Scanning
            </TabsTrigger>
            <TabsTrigger
              value="running-detection"
              class="w-full flex items-center justify-start dark:hover:bg-neutral-700"
            >
              <Footprints size={16} class="mr-2" />Running Detection
            </TabsTrigger>
            <TabsTrigger
              value="intrusion-detection"
              class="w-full flex items-center justify-start dark:hover:bg-neutral-700"
            >
              <PersonStanding size={16} class="mr-2" />Intrusion Detection
            </TabsTrigger>
            <TabsTrigger
              value="line-crossing"
              class="w-full flex items-center justify-start dark:hover:bg-neutral-700"
            >
              <Pipette size={16} class="mr-2" />Line Crossing
            </TabsTrigger>
            <TabsTrigger
              value="priority"
              class="w-full flex items-center justify-start dark:hover:bg-neutral-700"
            >
              <Siren size={16} class="mr-2" />Priority
            </TabsTrigger>
            <TabsTrigger
              value="motion-sensitivity"
              class="w-full flex items-center justify-start dark:hover:bg-neutral-700"
            >
              <Activity size={16} class="mr-2" />Motion Sensitivity
            </TabsTrigger>
          </TabsList>
        </div>

        <!-- Tab Content Left side -->
        <div class="h-[29rem] relative px-3">
          <!-- video saving -->
          <TabsContent value="video-saving">
            <div class="space-y-4 w-[32.7rem]">
              <div
                class="flex items-center justify-between p-2 gap-x-[23rem
                  ] border-b pb-2"
              >
                <Label class="text-nowrap">Video Saving</Label>
                <Switch bind:checked={save} />
              </div>

              {#if save}
                <!-- Add other video saving options here -->
                <div class="flex items-center space-x-4 pt-3">
                  <FolderSearch />
                  <div class="flex-1 space-y-1">
                    <p class="text-sm font-medium leading-none">Save Here</p>
                    <p class="text-sm text-muted-foreground">
                      Point your video to its future home.
                    </p>
                  </div>
                  <Input
                    id="picture"
                    type="text"
                    class="w-[180px] placeholder:dark:text-gray-400"
                    disabled
                    placeholder="./PlayBack"
                  />
                </div>
                <div class="flex items-center space-x-4 pt-3">
                  <Merge />
                  <div class="flex-1 space-y-1">
                    <p class="text-sm font-medium leading-none">
                      Overwrite Interval
                    </p>
                    <p class="text-sm text-muted-foreground">
                      Duration until the saved video is overwritten.
                    </p>
                  </div>
                  <Select.Root
                    onSelectedChange={(e) => (saveDuration = e.value)}
                  >
                    <Select.Trigger class="w-[180px]">
                      <Select.Value
                        placeholder={items.find((m) => m.value === saveDuration)
                          ?.label || "Select Duration"}
                      />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Group>
                        {#each items as fruit}
                          <Select.Item value={fruit.value} label={fruit.label}
                            >{fruit.label}</Select.Item
                          >
                        {/each}
                      </Select.Group>
                    </Select.Content>
                    <Select.Input name="favoriteFruit" />
                  </Select.Root>
                </div>
              {/if}
            </div>
          </TabsContent>

          <!-- face scanning -->
          <TabsContent value="face-scanning">
            <div class="space-y-4 w-full">
              <div
                class="flex items-center justify-between p-2 gap-x-[23rem] border-b pb-2"
              >
                <Label class="text-nowrap">Face Scanning</Label>
                <Switch bind:checked={face} />
              </div>
              {#if face}
                <div>
                  <Label>Face Detection Threshold</Label>
                  <p class="text-sm text-muted-foreground mt-1 mb-4">
                    Adjust the threshold to accomodate smaller or larger faces
                  </p>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[faceDetectionThreshold * 100]}
                    onValueChange={(e) => (faceDetectionThreshold = e[0] / 100)}
                    class="w-[60%]"
                  />
                </div>
                <div>
                  <Label>Face Search Threshold</Label>
                  <p class="text-sm text-muted-foreground mt-1 mb-4">
                    Adjust the threshold to accomodate smaller or larger faces
                  </p>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[faceSearchThreshold * 100]}
                    onValueChange={(e) => (faceSearchThreshold = e[0] / 100)}
                    class="w-[60%]"
                  />
                </div>
              {/if}
            </div>
          </TabsContent>

          <!-- intrusion detection -->
          <TabsContent value="intrusion-detection">
            <div class="space-y-4 w-full">
              <div class="border-b pb-2 p-2">
                <div class="flex items-center justify-between gap-x-[20rem]">
                  <Label
                    class="text-nowrap text-base
                    ">Intrusion Detection</Label
                  >
                  <Switch bind:checked={intrusionDetection} />
                </div>
                <p class="text-sm text-muted-foreground mt-1">
                  Parameters for identifying intrusions
                </p>
              </div>
              {#if intrusionDetection}
                <div class="px-3">Select mode of Intrusion</div>
                <RadioGroup class="flex gap-y-2 gap-x-40 px-3">
                  <div class="flex items-center space-x-2">
                    <Label for="vehicle">Vehicle Mode</Label>
                    <RadioGroupItem
                      value="vehicle"
                      id="vehicle"
                      bind:checked={intrusionVehicle}
                      class="border border-orange-500 text-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div class="flex items-center space-x-2">
                    <Label for="human">Human Mode</Label>
                    <RadioGroupItem
                      value="human"
                      id="human"
                      bind:checked={intrusionPerson}
                      class="border border-orange-500 text-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </RadioGroup>
              {/if}
            </div>
          </TabsContent>

          <!-- Line Crossing -->
          <TabsContent value="line-crossing">
            <div class="rounded-md p-2">
              <div
                class="flex items-start space-x-48 border-b pb-2 justify-between"
              >
                <div class="space-y-1">
                  <p class="text-base font-medium">Line Crossing</p>
                  <p class="text-sm text-muted-foreground text-nowrap">
                    Parameters for creating region of Interest
                  </p>
                </div>
                <Switch bind:checked={lineCrossing} />
              </div>
              <div>
                {#if lineCrossing}
                  <div class="">
                    <div class="my-3">Select mode of Line Crossing</div>
                    <div class="flex-col gap-y-6 px-3">
                      <div>
                        <Label>Face Detection Threshold</Label>
                        <p class="text-sm text-muted-foreground mt-1 mb-4">
                          Adjust the threshold to accomodate smaller or larger
                          faces
                        </p>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={[faceDetectionThreshold * 100]}
                          onValueChange={(e) =>
                            (faceDetectionThreshold = e[0] / 100)}
                          class="w-[60%]"
                        />
                      </div>
                      <div>
                        <Label>Face Search Threshold</Label>
                        <p class="text-sm text-muted-foreground mt-1 mb-4">
                          Adjust the threshold to accomodate smaller or larger
                          faces
                        </p>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={[faceSearchThreshold * 100]}
                          onValueChange={(e) =>
                            (faceSearchThreshold = e[0] / 100)}
                          class="w-[60%]"
                        />
                      </div>
                      <div>
                        <Label>Face Search Threshold</Label>
                        <p class="text-sm text-muted-foreground mt-1 mb-4">
                          Adjust the threshold to accomodate smaller or larger
                          faces
                        </p>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={[faceSearchThreshold * 100]}
                          onValueChange={(e) =>
                            (faceSearchThreshold = e[0] / 100)}
                          class="w-[60%]"
                        />
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </TabsContent>

          <!-- Priority -->
          <TabsContent value="priority">
            <div class="flex items-center space-x-[26rem] border-b pb-2 p-2">
              <div class="flex-1 space-y-1">
                <p class="text-sm font-medium leading-none">Priority</p>
              </div>
              <Switch bind:checked={priority} />
            </div>
          </TabsContent>

          <!-- motion sensitivity -->
          <TabsContent value="motion-sensitivity">
            <div
              class="rounded-md p-2 my-2 flex items-center justify-between w-[33rem]"
            >
              <div class="flex items-center space-x-4 mx-4">
                <Activity />
                <p class="text-sm font-medium leading-none">
                  Motion Sensitivity
                </p>
              </div>
              <div class="flex items-center gap-8 w-52">
                <Slider
                  min={0}
                  value={[motion === 1000 ? 0 : motion]}
                  max={5000}
                  step={2500}
                  class="w-32"
                  onValueChange={(e) => {
                    motion = e[0];
                  }}
                />
                {motion === 5000 ? "High" : motion === 2500 ? "Mid" : "Low"}
              </div>
            </div>
          </TabsContent>

          <div class="flex justify-end items-end absolute bottom-0 w-full">
            <div class="border-t pt-4 w-full text-right">
              <Button variant='vehant' type="submit">Save Changes</Button>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  </Dialog.Content>
</Dialog.Root>
