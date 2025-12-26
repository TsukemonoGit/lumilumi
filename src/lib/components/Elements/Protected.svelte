<script lang="ts">
  import { Shield } from "lucide-svelte";
  let { zIndex }: { zIndex: number | undefined } = $props();
</script>

<Shield
  size={14}
  class="absolute top-1 left-0 text-yellow-600 fill-yellow-400"
  style={`z-index:${zIndex || 10 + 1}`}
/>
