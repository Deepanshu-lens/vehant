<script lang="ts">
  import { Button } from "@/components/ui/button";
  //   import {
  //     Tooltip,
  //     TooltipContent,
  //     TooltipProvider,
  //     TooltipTrigger,
  //   } from "@/components/ui/tooltip";
  // import { Tooltip } from "bits-ui";
</script>

<Button
  variant="ghost"
  size="icon"
  class="p-0 text-black/[.4] hover:text-black"
>
  <slot />
</Button>
<!-- 
<Tooltip.Root>
  <Tooltip.Trigger />
  <Tooltip.Content>
    <Tooltip.Arrow />
  </Tooltip.Content>
</Tooltip.Root> -->
