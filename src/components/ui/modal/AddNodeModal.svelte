<script lang="ts">
  import { toast } from "svelte-sonner";
  import * as Dialog from "@/components/ui/dialog";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Button } from "@/components/ui/button";
  import { Slider } from "@/components/ui/slider";
  import { Switch } from "@/components/ui/switch";
  import { ChevronDown, PlusCircle, X } from "lucide-svelte";
  import * as Select from "@/components/ui/select/index";
  import { selectedNode } from "@/stores";

  let cameraName = "";
  let cameraURL = "";
  let subURL = "";
  let cameraUsername = "";
  let cameraPass = "";
  let cameraIp = "";
  let saving: boolean = false;
  let vehicle: boolean = false;
  let face: boolean = false;
  let dialogOpen: boolean = false;
  let company: number = 0;
  let disabled: string | null = null;
  let priority: boolean = true;
  let motionThresh: number = 0;
  let nvrName = "";
  let sparshID = "";

  let mode = 2;
  let uploadMode = 1;
  let addMode = 1;
  export let addSubNode = false;
  let modeAdd = addSubNode ? 2 : 1;
  let addNodeCounter = 1;
  let subNodeCounter = 1;
  let addDevice = 1;
  let nodeName = [];
  let subNodeNames = [];
  let chosenNode: any;
  let httpPort: null | number = null;
  let nvrUserId;
  let nvrPass;
  let nvrIp;
  let nvrPort;
  let vehicleScan: boolean = false;
  let serverIPs: string[] = [""];

  const addMoreIPs = () => {
    serverIPs = [...serverIPs, ""];
  };

  //   New declared varibles
  let mainURL = "";
  let usingRTSP = true;
  let features = {
    feedSaving: false,
    vehicleScan: false,
    faceScan: false,
    priority: false,
  };

  export let sNode;
  export let nodes;

  const onSubmit = () => {
    console.log(mode, "mode here");
    if (addMode === 1) {
      let modifiedCameraURL = cameraURL;
      let modSubURL = subURL;
      const urlParts = cameraURL.split("@");
      console.log(urlParts);
      const atIndex = cameraURL.indexOf("@");
      if (urlParts.length > 2) {
        console.log(atIndex);
        modifiedCameraURL = urlParts[0] + "%40" + urlParts.slice(1).join("@");
      }
      const subParts = subURL.split("@");
      if (subParts.length > 2) {
        modSubURL = subParts[0] + "%40" + subParts.slice(1).join("@");
      }
      console.log(modifiedCameraURL, "Modified CaMURL");
      console.log(subURL, "suburl");

      fetch("/api/camera/addCamera", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cameraName,
          url: modifiedCameraURL,
          subUrl: subURL,
          nodeId: sNode ? sNode.id : $selectedNode.id,
          sessionId: $selectedNode.session,
          face: face,
          save: saving,
          saveFolder: "./PlayBack/",
          saveDuration: 30 * 60 * 24,
          vehicle: vehicle,
          faceDetThresh: 0.93,
          faceMatchThresh: 0.3,
          vehicleDetThresh: 0.4,
          vehiclePlateThresh: 0.5,
          vehicleOCRThresh: 0.6,
          priority: priority === true ? 1 : 0,
          motionThresh:
            motionThresh === 0 ? 1000 : motionThresh === 50 ? 2500 : 5000,
          sparshID: sparshID,
          vehicleScan: vehicleScan,
        }),
      }).then((response) => {
        if (response.ok) {
          dialogOpen = false;
        }
        toast("Camera added!");
      });
    } else {
      // onvif://admin:admin123@50.168.139.58:80
      const onvifUrl = `onvif://${cameraUsername}:${cameraPass}@${cameraIp}${httpPort ? `:${httpPort}` : ""}`;
      console.log(onvifUrl);

      let onvifData;

      fetch(`http://localhost:8084/api/onvif?url=${onvifUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data) {
            onvifData = data;
            if (onvifData) {
              const main =
                onvifData[0].stream_type === "MainStream"
                  ? onvifData[0].url
                  : onvifData[1].url;
              const sub =
                onvifData[1].stream_type === "SubStream"
                  ? onvifData[1].url
                  : onvifData[0].url;

              if (main && sub) {
                fetch("/api/camera/addCamera", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    name: cameraName,
                    url: main,
                    subUrl: sub,
                    nodeId: sNode ? sNode.id : $selectedNode.id,
                    sessionId: $selectedNode.session,
                    face: face,
                    save: saving,
                    saveFolder: "./PlayBack/",
                    saveDuration: 30 * 60 * 24,
                    vehicle: vehicle,
                    faceDetThresh: 0.93,
                    faceMatchThresh: 0.3,
                    vehicleDetThresh: 0.4,
                    vehiclePlateThresh: 0.5,
                    vehicleOCRThresh: 0.6,
                    priority: priority === true ? 1 : 0,
                    motionThresh:
                      motionThresh === 0
                        ? 1000
                        : motionThresh === 50
                          ? 2500
                          : 5000,
                    sparshID: sparshID,
                    vehicleScan: vehicleScan,
                  }),
                }).then((response) => {
                  if (response.ok) {
                    dialogOpen = false;
                  }
                  toast("Camera added!");
                });
              }
            }
          } else {
            toast("Failed to add camera via ONVIF");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          toast("Error adding camera via ONVIF");
        });
    }
  };

  const onSubmitNVR = async () => {
    await fetch("/api/nvr/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nvrName,
        password: nvrPass,
        user_id: nvrUserId,
        http_port: nvrPort,
        ip: nvrIp,
        node: $selectedNode.id,
        nodeName: $selectedNode.name,
      }),
    })
      .then((response) => {
        if (response.ok) {
          dialogOpen = false;
        }
        toast("NVR added!");
      })
      .catch((err) => console.log(err));
  };

  function updateCompany(value: number) {
    company = value;
  }

  async function handleAddNode() {
    // Check all nodeNames for underscores first
    const invalidNodes = nodeName.filter((node) => node.includes("_"));

    if (invalidNodes.length > 0) {
      toast.error(
        '"_" are not allowed for Node names, please try with some other name!'
      );
      return;
    }

    for (let node of nodeName) {
      await fetch("/api/node/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: node,
          sessionId: $selectedNode?.session,
        }),
      }).catch((err) => console.log(err));
      // console.log(node)
    }
    dialogOpen = false;
    nodeName = [];
    addNodeCounter = 1;
  }

  let selectedMethod = "Manually";
  let selectedLens = "Lens Office";
  let isBulkUpload = false;

  const methods = ["Manually", "Automatically", "Via API"];
  const lenses = ["Lens Office", "Lens Home", "Lens Outdoor"];

  async function handleAddSubNodes() {
    // Check all subNodeNames for underscores first
    const invalidSubNodes = subNodeNames.filter((sub) => sub.includes("_"));

    if (invalidSubNodes.length > 0) {
      toast.error(
        '"_" are not allowed for subNode names, please try with some other name!'
      );
      return;
    }

    for (let subs of subNodeNames) {
      await fetch("/api/node/subnode/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subNode: subs,
          node: chosenNode.name,
          sessionId: $selectedNode.session,
        }),
      });
      dialogOpen = false;
      subNodeNames = [];
      subNodeCounter = 1;
    }
  }
  $: {
    if (
      cameraUsername?.length > 0 ||
      cameraPass?.length > 0 ||
      cameraIp?.length > 0
    ) {
      disabled = "url";
    } else if (cameraURL?.length > 0) {
      disabled = "other";
    } else {
      disabled = null;
    }
  }
</script>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Trigger><slot /></Dialog.Trigger>
  <Dialog.Content
    class="sm:max-w-[920px] scale-90 sm:scale-100 z-[70] max-h-[95%] sm:max-h-auto overflow-y-scroll p-0"
  >
    <Dialog.Header class="border-b border-gray-200 p-4 mb-0">
      <Dialog.Title>Node Settings</Dialog.Title>
    </Dialog.Header>

    <div class="flex h-[30rem]">
      <!-- sidebar content -->
      <div
        class="w-1/3 border-r px-4 bg-[#F3F3F3] dark:bg-black dark:text-white h-full"
      >
        <button
          class="font-semibold w-full text-left my-3 px-4 py-2 rounded-md dark:hover:bg-neutral-700 {modeAdd ===
          1
            ? 'dark:bg-neutral-700 shadow-md bg-white'
            : 'dark:hover:bg-neutral-700'}"
          on:click={() => (modeAdd = 1)}
        >
          Add Node
        </button>
        <button
          class="font-semibold w-full text-left my-3 px-4 py-2 rounded-md dark:hover:bg-neutral-700 {modeAdd ===
          2
            ? 'dark:bg-neutral-700 shadow-md bg-white'
            : 'dark:hover:bg-neutral-700'}"
          on:click={() => (modeAdd = 2)}
        >
          Add Sub-node
        </button>
        <button
          class="font-semibold w-full text-left my-3 px-4 py-2 rounded-md {modeAdd ===
          3
            ? 'dark:bg-neutral-700 shadow-md bg-white'
            : 'dark:hover:bg-neutral-700'}"
          on:click={() => (modeAdd = 3)}
        >
          Add Camera
        </button>
        <button
          class="font-semibold w-full text-left my-3 px-4 py-2 rounded-md {modeAdd ===
          4
            ? 'dark:bg-neutral-700 shadow-md bg-white'
            : 'dark:hover:bg-neutral-700'}"
          on:click={() => (modeAdd = 4)}
        >
          Add Server
        </button>
      </div>

      <!-- main add container -->
      <div class="w-2/3 pl-4 flex flex-col h-full mx-2">
        <div class="flex-grow">
          {#if modeAdd === 1}
            <h2 class="text-xl font-bold mb-4 border-b pb-2">Add Node</h2>
          {:else if modeAdd === 2}
            <h2 class="text-xl font-bold mb-4 border-b pb-2">Add Sub-node</h2>
          {:else if modeAdd === 4}
            <h2 class="text-xl font-bold mb-4 border-b pb-2">Add Server</h2>
          {/if}

          <!-- add Node -->
          {#if modeAdd === 1}
            {#each Array(addNodeCounter) as _, index (index)}
              <div class="mb-4">
                <Label for="node-name">Node Name {index + 1}</Label>
                <Input
                  id="node-name"
                  placeholder="Office"
                  bind:value={nodeName[index]}
                  class="w-96 bg-[#F6F6F6] dark:bg-neutral-400 mt-1 dark:text-black dark:placeholder:text-black"
                />
              </div>
            {/each}
            <button
              class="text-orange-500 flex items-center"
              on:click={() => (addNodeCounter += 1)}
            >
              <PlusCircle size={18} class="mr-2" /> Add New Node
            </button>

            <!-- add Sub-node -->
          {:else if modeAdd === 2}
            <div class="mb-4">
              <div class=" items-center gap-4 py-2">
                <Label for={`node-name`}>Select Node</Label>
                <div class="relative col-span-3 mt-1">
                  <!-- <ChevronDown
                    size={18}
                    class="text-[#727272] absolute top-1/2 pointer-events-none -translate-y-1/2 right-2"
                  /> -->
                  <select
                    class="w-full p-2 border border-gray-300 bg-[#F6F6F6] dark:bg-neutral-400 rounded-md"
                    bind:value={chosenNode}
                  >
                    {#if nodes && nodes.length > 0}
                      {#each nodes as node}
                        <option value={node}>{node?.name}</option>
                      {/each}
                    {/if}
                  </select>
                </div>
              </div>
            </div>
            {#each Array(subNodeCounter) as _, index (index)}
              <div class="mb-4">
                <Label for="sub-node">Sub-node {index + 1}</Label>
                <Input
                  id="sub-node"
                  placeholder="Office"
                  bind:value={subNodeNames[index]}
                  class="w-96 bg-[#F6F6F6] dark:bg-neutral-400 mt-1 dark:text-black dark:placeholder:text-black"
                />
              </div>
            {/each}
            <button
              class="text-orange-500 flex items-center"
              on:click={() => (subNodeCounter += 1)}
            >
              <PlusCircle size={18} class="mr-2" /> Add Sub Node
            </button>

            <!-- Add camera mode -->
          {:else if modeAdd === 3}
            <div class="drop-shadow-md px-2">
              <div
                class="w-full flex flex-col items-start justify-center py-4 gap-4"
              >
                <div class="flex-cb w-full border-b pb-2">
                  <div class="flex-1">
                    <h2 class="text-xl font-bold">Add Camera</h2>
                  </div>
                  <div
                    class="flex items-center justify-center rounded-lg dark:border-neutral-400 border-black border-solid border-[1px] p-1 w-[200px] h-[40px] mx-auto"
                  >
                    <button
                      on:click={() => (addDevice = 1)}
                      class={`rounded-lg text-xs leading-[18px] px-[10px] py-[3px] font-medium w-1/2 h-full ${addDevice === 1 ? "text-white bg-[#E77817]" : "bg-transparent"}`}
                      >Camera</button
                    >
                    <button
                      on:click={() => (addDevice = 2)}
                      class={`rounded-lg text-xs leading-[18px] px-[10px] py-[3px] font-medium w-1/2 h-full ${addDevice === 2 ? "text-white bg-[#E77817]" : "bg-transparent"}`}
                      >NVR</button
                    >
                  </div>
                </div>

                {#if addDevice === 1}
                  <!-- camera mode container -->
                  <div class="camera-mode-container">
                    <div class="space-y-4">
                      <div class="flex justify-between items-center gap-x-36">
                        <div class="text-base">
                          Select method of adding camera
                        </div>
                        <Select.Root bind:value={selectedMethod}>
                          <Select.Trigger
                            class="w-40 border-none box-shadow-none dark:border-neutral-200"
                          >
                            <Select.Value placeholder="Select method" />
                          </Select.Trigger>
                          <Select.Content>
                            {#each methods as method}
                              <Select.Item value={method}>{method}</Select.Item>
                            {/each}
                          </Select.Content>
                        </Select.Root>
                      </div>

                      <div class="flex items-center space-x-8">
                        <Select.Root
                          bind:value={selectedLens}
                          class="flex-grow dark:text-black dark:placeholder:text-black"
                        >
                          <Select.Trigger
                            class="w-64 bg-gray-100 dark:bg-neutral-500 mt-1 dark:text-black dark:placeholder:text-black"
                          >
                            <Select.Value
                              placeholder="Select lens"
                              class="dark:text-black text-white"
                            />
                          </Select.Trigger>
                          <Select.Content>
                            {#each lenses as lens}
                              <Select.Item value={lens}>{lens}</Select.Item>
                            {/each}
                          </Select.Content>
                        </Select.Root>

                        <span
                          class={isBulkUpload
                            ? "text-gray-400 text-sm text-nowrap"
                            : "text-gray-600 text-sm text-nowrap"}
                          >Single upload</span
                        >
                        <Switch bind:checked={isBulkUpload} />
                        <span
                          class={isBulkUpload
                            ? "text-gray-600 text-nowrap"
                            : "text-gray-400 text-nowrap"}>Bulk upload</span
                        >
                      </div>
                    </div>

                    <div class="grid gap-4 w-full">
                      <div class="mt-4">
                        <Label for="camera-name">Camera Name</Label>
                        <Input
                          id="camera-name"
                          placeholder="Home-Porch"
                          class="w-96 mt-3"
                          bind:value={cameraName}
                        />
                      </div>

                      <div class="flex items-center gap-4 text-sm pb-2 mt-4">
                        <button
                          on:click={() => (usingRTSP = true)}
                          class={usingRTSP
                            ? "text-primary font-semibold border-b-2 border-[#015A62]"
                            : "text-[#5F6064]"}>Using URL</button
                        >
                        <button
                          on:click={() => (usingRTSP = false)}
                          class={!usingRTSP
                            ? "text-primary font-semibold border-b-2 border-[#015A62]"
                            : "text-[#5F6064]"}>Using Details</button
                        >
                      </div>

                      {#if usingRTSP}
                        <div class="grid gap-4">
                          <div class="gap-4">
                            <Label for="main-url">Main URL</Label>
                            <Input
                              id="main-url"
                              placeholder="rtsp://admin:password@123.123.123.123/stream/1"
                              class="col-span-3 mt-3"
                              bind:value={mainURL}
                            />
                          </div>
                          <div class="gap-4 mt-1">
                            <Label for="sub-url">Sub URL</Label>
                            <Input
                              id="sub-url"
                              placeholder="rtsp://admin:password@123.123.123.123/sub-stream/1"
                              class="col-span-3 mt-2"
                              bind:value={subURL}
                            />
                          </div>
                        </div>
                      {:else}
                        <div class="grid gap-4">
                          <div class="grid gap-4 py-4">
                            <div class="grid grid-cols-4 items-center gap-4">
                              <Label for="camera-username">Username</Label>
                              <Input
                                id="camera-username"
                                class="col-span-3"
                                placeholder={"Camera portal username"}
                                disabled={disabled === "other"}
                                bind:cameraUsername
                                on:change={(e) =>
                                  (cameraUsername = e.target.value)}
                              />
                              <Label for="camera-pass">Password</Label>
                              <Input
                                autocomplete="new-password"
                                id="camera-pass"
                                class="col-span-3"
                                placeholder={"Camera portal password"}
                                type="password"
                                disabled={disabled === "other"}
                                bind:cameraPass
                                on:change={(e) => (cameraPass = e.target.value)}
                              />
                              <Label for="camera-ip">IP Address</Label>
                              <Input
                                id="camera-ip"
                                class="col-span-3"
                                placeholder={"address associated with camera"}
                                disabled={disabled === "other"}
                                bind:cameraIp
                                on:change={(e) => (cameraIp = e.target.value)}
                              />
                              <Label for="camera-ip">HTTP Port</Label>
                              <Input
                                id="camera-port"
                                class="col-span-3"
                                placeholder={"Port"}
                                disabled={disabled === "other"}
                                bind:httpPort
                                on:change={(e) => (httpPort = e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      {/if}

                      <h3 class="text-xl font-semibold mt-5 border-b pb-2">
                        Features
                      </h3>

                      <div class="flex item-start gap-x-10">
                        <h5 class="text-sm font-medium text-nowrap">
                          Camera Features
                        </h5>
                        <div class="grid grid-cols-4 items-center gap-4">
                          <div class="col-span-3 flex flex-wrap gap-8">
                            <!-- svelte-ignore a11y-label-has-associated-control -->
                            <label class="flex items-center gap-4">
                              <Switch
                                bind:checked={features.feedSaving}
                                class="w-8 h-5"
                              />
                              <span class="text-sm text-neutral-500"
                                >Feed Saving</span
                              >
                            </label>
                            <!-- svelte-ignore a11y-label-has-associated-control -->
                            <label class="flex items-center gap-4">
                              <Switch
                                bind:checked={features.vehicleScan}
                                class="w-8 h-5"
                              />
                              <span class="text-sm text-neutral-500"
                                >Vehicle Scan</span
                              >
                            </label>
                            <!-- svelte-ignore a11y-label-has-associated-control -->
                            <label class="flex items-center gap-4">
                              <Switch
                                bind:checked={features.faceScan}
                                class="w-8 h-5"
                              />
                              <span class="text-sm text-neutral-500"
                                >Face Scan</span
                              >
                            </label>
                            <!-- svelte-ignore a11y-label-has-associated-control -->
                            <label class="flex items-center gap-4">
                              <Switch
                                bind:checked={features.priority}
                                class="w-8 h-5"
                              />
                              <span class="text-sm text-neutral-500"
                                >Priority</span
                              >
                            </label>
                          </div>
                        </div>
                      </div>

                      <div class="grid grid-cols-4 items-center gap-4 mt-8">
                        <span class="text-sm font-medium"
                          >Motion Sensitivity</span
                        >
                        <div class="flex items-center gap-4 grid-cols-3">
                          <Slider
                            min={0}
                            value={[motionThresh]}
                            max={100}
                            step={50}
                            class="w-32"
                            onValueChange={(e) => {
                              motionThresh = e[0];
                            }}
                          />
                          {motionThresh === 0
                            ? "Low"
                            : motionThresh === 50
                              ? "Mid"
                              : "High"}
                        </div>
                      </div>
                    </div>
                  </div>
                {:else}
                  <!-- NVR Mode container -->
                  <div class="nvr-mode-container">
                    <div class="grid w-full gap-4 py-4">
                      <p class="text-base font-semibold text-muted-foreground">
                        Insert a new NVR in <span
                          class="text-primary font-bold"
                        >
                          {$selectedNode.name}
                        </span> node and its parent nodes.
                      </p>
                      <div class="grid grid-cols-4 items-center gap-4">
                        <Label for="nvr-name">NVR Name</Label>
                        <Input
                          id="nvr-name"
                          placeholder={"Home-Porch"}
                          class="col-span-3"
                          bind:nvrName
                          on:change={(e) => (nvrName = e.target.value)}
                        />
                      </div>

                      <div class="grid gap-4 py-4">
                        <div class="grid gap-4 py-4">
                          <div class="grid grid-cols-4 items-center gap-4">
                            <Label for="nvr-userid">User ID</Label>
                            <Input
                              id="nvr-userId"
                              class="col-span-3"
                              placeholder={"Camera portal username"}
                              bind:nvrUserId
                              on:change={(e) => (nvrUserId = e.target.value)}
                            />
                            <Label for="nvr-pass">Password</Label>
                            <Input
                              autocomplete="nvr-pass"
                              id="camera-pass"
                              class="col-span-3"
                              placeholder={"Camera portal password"}
                              type="password"
                              bind:nvrPass
                              on:change={(e) => (nvrPass = e.target.value)}
                            />
                            <Label for="nvr-ip">IP Address</Label>
                            <Input
                              id="nvr-ip"
                              class="col-span-3"
                              placeholder={"address associated with camera"}
                              bind:nvrIp
                              on:change={(e) => (nvrIp = e.target.value)}
                            />
                            <Label for="camera-ip">HTTP Port</Label>
                            <Input
                              id="camera-port"
                              class="col-span-3"
                              placeholder={"Port"}
                              bind:nvrPort
                              on:change={(e) => (nvrPort = e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Add Server Mode -->
          {:else if modeAdd === 4}
            <div class="mb-4">
              {#each serverIPs as ip, index}
                <Label for="ip-address" class="text-lg font-semibold"
                  >IP Address {index + 1}</Label
                >
                <Input
                  id="ip-address-{index}"
                  placeholder="Enter IP Address"
                  bind:value={serverIPs[index]}
                  class="w-96 bg-[#F6F6F6] dark:bg-neutral-400 mt-1 dark:text-black dark:placeholder:text-black"
                />
              {/each}
            </div>
            <button
              class="text-orange-500 flex items-center"
              on:click={addMoreIPs}
            >
              <PlusCircle size={18} class="mr-2" /> Add more
            </button>
          {/if}
        </div>
        <Dialog.Footer>
          <!-- Dialog Footer -->
          {#if modeAdd === 1}
            <!-- Add Node -->
            <div class="mt-auto w-32 self-end m-4">
              <Button
              variant='vehant'
                disabled
                type="submit"
                on:click={() => handleAddNode()}
                class="w-full">Submit</Button
              >
            </div>
          {:else if modeAdd === 2}
            <!-- Add Sub-Node -->
            <Button
              disabled
              class="mt-auto w-32 self-end m-4"
              variant='vehant'
              on:click={() => handleAddSubNodes()}>Submit</Button
            >
          {:else if modeAdd === 3}
            {#if addDevice === 1}
              <!-- Add Camera -->
              <Button
                disabled
                class="mt-auto w-32 self-end m-4"
                variant='vehant'
                on:click={onSubmit}
                type="submit">Submit</Button
              >
            {:else}
              <!-- Add NVR -->
              <Button
                disabled
                class="mt-auto w-32 self-end m-4"
                variant='vehant'
                on:click={onSubmitNVR}
                type="submit">Add NVR</Button
              >
            {/if}
          {:else}
            <!-- Add Server -->
            <Button
              disabled
              class="mt-auto w-32 self-end m-4"
              variant='vehant'
              type="submit">Submit</Button
            >
          {/if}
        </Dialog.Footer>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
