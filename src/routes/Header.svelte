<script lang="ts">
  import RelayStatus from "$lib/components/RelayStatus.svelte";
  import { currentPage } from "./menu";
</script>

<header>
  <div class=" fixed top-0 w-full z-50 h-8 backdrop-blur bg-neutral-900/50">
    <div class="flex w-full h-8 justify-center items-center gap-4">
      {#if $currentPage?.Icon}
        <div>
          <svelte:component this={$currentPage.Icon} />
        </div>
      {/if}
      <div class="uppercase font-bold">{$currentPage?.alt ?? "lumilumi"}</div>
      <RelayStatus />
    </div>
  </div>
</header>

<style>
  header {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
</style>
