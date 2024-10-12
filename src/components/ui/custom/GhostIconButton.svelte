<script lang="ts">
  import { Button } from "@/components/ui/button";
  //   import {
  //     Tooltip,
  //     TooltipContent,
  //     TooltipProvider,
  //     TooltipTrigger,
  //   } from "@/components/ui/tooltip";
</script>

<Button
  variant="ghost"
  size="icon"
  class="p-1 text-black/[.4] hover:text-black"
>
  <slot />
</Button>
