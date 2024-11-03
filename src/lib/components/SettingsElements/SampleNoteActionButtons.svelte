<script lang="ts">
  import {
    Repeat2,
    Heart,
    MessageSquare,
    Quote,
    Zap,
    SmilePlus,
    Ellipsis,
  } from "lucide-svelte";

  export let showReactioninTL;
</script>

<div
  class="flex justify-between py-0.5 mr-2 max-w-full overflow-x-hidden gap-1"
>
  <div class="flex items-end text-sm">
    <MessageSquare size="20" class=" text-magnum-500/75 overflow-hidden " />
  </div>

  <div class="flex items-end text-sm">
    <Repeat2
      size="21"
      class=" text-magnum-500/75 mt-auto overflow-hidden"
    />{#if showReactioninTL}2{/if}
  </div>

  <div class="flex items-end text-sm">
    <Heart
      size="20"
      class="text-magnum-500/75 mt-auto overflow-hidden"
    />{#if showReactioninTL}4{/if}
  </div>

  <div class="flex items-end text-sm">
    <SmilePlus size="20" class="stroke-magnum-500/75" />
  </div>

  <div class="flex items-end text-sm">
    <Zap
      size="20"
      class=" text-magnum-500/75 mt-auto overflow-hidden"
    />{#if showReactioninTL}1{/if}
  </div>
  <Ellipsis size="20" class=" text-magnum-500/75 overflow-hidden " />
</div>

<style>
  input[type="text"] {
    background-color: rgb(var(--color-neutral-800) / 1);
  }
  input[type="number"] {
    background-color: rgb(var(--color-neutral-800) / 1);
  }
</style>
