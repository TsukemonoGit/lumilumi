<script lang="ts">
  let searchWord: string = "";
  let searchKind: number = 1;

  //nip50relays
</script>

<div class="flex flex-col items-start justify-center">
  <div class=" font-medium text-magnum-400">keyword</div>
  <input
    type="text"
    id="word"
    class="h-10 w-[240px] rounded-md px-3 py-2 border border-magnum-500"
    placeholder=""
    bind:value={searchWord}
  />
</div>
<div class="flex flex-col items-start justify-center">
  <div class=" font-medium text-magnum-400">kind</div>

  <input
    type="number"
    id="kind"
    class="h-10 w-[240px] rounded-md px-3 py-2 border border-magnum-500"
    placeholder=""
    min="0"
    bind:value={searchKind}
  />
</div>
