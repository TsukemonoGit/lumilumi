<script lang="ts">
  import { EyeOff } from "lucide-svelte";
  let { zIndex }: { zIndex: number | undefined } = $props();
</script>

<div
  class="absolute top-0 left-0 bg-neutral-500/80 rounded-full p-1 text-magnum-700 dark:text-magnum-300"
  style={`z-index:${zIndex || 10 + 1}`}
>
  <EyeOff size={14} />
</div>
