<script lang="ts">
	import { Switch as SwitchPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
  
	type $$Props = SwitchPrimitive.Props;
  
	let className: $$Props["class"] = undefined;
	export let checked: $$Props["checked"] = undefined;
	export { className as class };
  </script>
  
  <SwitchPrimitive.Root
	bind:checked
	class={cn(
	  "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#00743A]/10 data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-neutral-700 dark:data-[state=checked]:bg-neutral-700",
	  className,
	)}
	{...$$restProps}
  >
	<SwitchPrimitive.Thumb
	  class={cn(
		"pointer-events-none block h-4 w-4 rounded-full bg-[#00743A] dark:data-[state=unchecked]:bg-neutral-500 shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
	  )}
	/>
  </SwitchPrimitive.Root>
  