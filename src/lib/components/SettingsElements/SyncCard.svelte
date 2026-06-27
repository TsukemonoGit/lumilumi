<script lang="ts">
  import { nowProgress } from "$lib/stores/stores";
  import { RotateCw } from "lucide-svelte";
  import type { MouseEventHandler } from "svelte/elements";
  import { t as _ } from "@konemono/svelte5-i18n";
  interface Props {
    onclickUpdate: MouseEventHandler<HTMLButtonElement>;
    label: string;
    updatedAt: string;
    viewable: boolean;
    onclickView: MouseEventHandler<HTMLButtonElement>;
  }
  let { onclickUpdate, label, updatedAt, viewable, onclickView }: Props =
    $props();
</script>

<div class="grid grid-cols-[auto_1fr_auto] gap-2">
  <button
    type="button"
    disabled={$nowProgress}
    class="h-10 w-10 rounded-full bg-magnum-800/80 font-medium text-neutral-200 myButton flex items-center justify-center"
    onclick={onclickUpdate}><RotateCw /></button
  >
  <div>
    <div class="font-semibold">{label}</div>
    {#if updatedAt}
      <time class="text-neutral-500 text-xs"
        >{$_("settings.lastUpdated")}: {updatedAt}</time
      >{/if}
  </div>
  {#if viewable}
    <button
      type="button"
      class="myButton rounded-full px-4 font-semibold text-neutral-200 bg-neutral-800"
      onclick={onclickView}>view data</button
    >{/if}
</div>
