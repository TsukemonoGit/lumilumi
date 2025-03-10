<script lang="ts">
  let { children } = $props();
</script>

<span class="text-sm font-bold text-neutral-400">To:</span
>{@render children?.()}
