<script lang="ts">
  import { user } from "@/stores/user";
  import { cn } from "@/lib/utils";
  import * as Popover from "@/components/ui/popover";
  import * as Avatar from "@/components/ui/avatar";
  let profileOn = false;
</script>

<Popover.Root bind:open={profileOn}>
  <Popover.Trigger
    ><button
      class={cn(
        "hidden items-end md:flex p-1 rounded-md  space-x-2",
        profileOn ? "bg-slate-100 dark:bg-gray-900" : "hover:bg-accent "
      )}
    >
      <Avatar.Root class="w-8 h-8">
        <Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
        <Avatar.Fallback>CN</Avatar.Fallback>
      </Avatar.Root>
      <div class="flex flex-col text-left">
        <span class="text-sm font-medium">{$user?.name}</span>
        <span class="text-[0.6rem] font-medium">{$user?.email}</span>
      </div>
    </button></Popover.Trigger
  >
  <Popover.Content
    class="p-0 w-60 divide-y  rounded-lg  text-sm font-normal  transform opacity-100 scale-100"
  >
    <p class="truncate px-3.5 py-3" role="none">
      <span class="block text-xs text-gray-500" role="none">Signed in as</span
      ><span class="mt-0.5 font-semibold" role="none">{$user?.email}</span>
    </p>
    <div class="py-1.5" role="none">
      <a class="block py-1.5 px-3.5 hover:bg-accent">Changelog</a><a
        class="block py-1.5 px-3.5 hover:bg-accent">Support</a
      ><a class="block py-1.5 px-3.5 hover:bg-accent">License</a>
    </div>
    <div class="py-1.5" role="none">
      <a class="block py-1.5 px-3.5 hover:bg-accent">Upgrade to Team License</a>
    </div>
    <div class="py-1.5" role="none">
      <a class="block py-1.5 px-3.5 hover:bg-accent">Account Settings</a><button
        type="button"
        class="block w-full py-1.5 text-left px-3.5 hover:bg-accent"
        >Sign out</button
      >
    </div></Popover.Content
  >
</Popover.Root>
