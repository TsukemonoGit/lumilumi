<!-- InputNumber.svelte -->
<script lang="ts">
  let { onConfirm }: { onConfirm: (value: number) => void } = $props();

  let value = $state(0);
</script>

<div class="flex gap-1 p-1">
  <input
    type="number"
    bind:value
    class="flex-1 bg-neutral-900 text-neutral-100 rounded p-1"
    placeholder="kind"
    onkeydown={(e) => e.key === "Enter" && onConfirm(value)}
  />
  <button
    type="button"
    class="bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded px-4 mr-2"
    onclick={() => onConfirm(value)}
  >
    OK
  </button>
</div>
