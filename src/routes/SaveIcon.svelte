<script lang="ts">
  import { saveStatus } from "$lib/stores/globalRunes.svelte";
  import { fade } from "svelte/transition";
</script>

{#if saveStatus.value}
  <div
    transition:fade={{ duration: 200 }}
    class="w-fit text-xs font-bold px-2 rounded-full bg-magnum-800 text-magnum-200"
  >
    Saved
  </div>
{/if}
