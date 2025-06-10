<script lang="ts">
  import type { ImageAutoExpand } from "$lib/types";
  import { RadioGroup } from "melt/builders";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { onMount } from "svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  let { imageAutoExpand = $bindable() } = $props();

  const group = new RadioGroup({});
  const items: ImageAutoExpand[] = ["all", "following", "manual"];

  $effect(() => {
    if (group.value) {
      imageAutoExpand = group.value;
    }
  });
  onMount(() => {
    group.value = lumiSetting.get().imageAutoExpand || items[0];
  });
</script>

<div {...group.root} class="space-y-3 ml-8 my-2">
  <!-- svelte-ignore a11y_label_has_associated_control -- https://github.com/sveltejs/svelte/issues/15067 -->
  <label {...group.label} class="font-medium">
    {$_("settings.display.imageAutoExpand.label")}
  </label>

  <div class="space-y-2 mx-2">
    {#each items as i}
      {@const item = group.getItem(i)}
      <label
        {...item.attrs}
        class="flex items-center gap-3 p-2 rounded-lg border border-neutral-200 dark:border-neutral-600
               hover:bg-neutral-700/50 cursor-pointer transition-colors
               {item.checked
          ? 'bg-magnum-600/20 border-magnum-300 dark:border-magnum-600'
          : ''}"
      >
        <div class="relative flex items-center justify-center">
          <div
            class="w-4 h-4 rounded-full border-2 border-neutral-300 dark:border-neutral-500
                     {item.checked
              ? 'border-magnum-500 dark:border-magnum-400'
              : ''}"
          >
            {#if item.checked}
              <div
                class="w-2 h-2 rounded-full bg-magnum-500 dark:bg-magnum-400
                         absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              ></div>
            {/if}
          </div>
        </div>
        <span class="text-sm select-none">
          {$_(`settings.display.imageAutoExpand.${i}`)}
        </span>
      </label>
    {/each}
  </div>

  <input {...group.hiddenInput} />
</div>
