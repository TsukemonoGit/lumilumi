<script lang="ts">
  let { relayInfo } = $props();
</script>

<h2 class="m-0 text-lg font-medium">Relay Information</h2>
<div
  class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[30vh]"
>
  {JSON.stringify(relayInfo, null, 2)}
</div>
