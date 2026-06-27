<script lang="ts">
  import type { ImageAutoExpand } from "$lib/types";
  import { RadioGroup } from "melt/builders";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { onMount } from "svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { Circle } from "lucide-svelte";

  let { imageAutoExpand = $bindable() } = $props();

  const group = new RadioGroup({});
  const items: ImageAutoExpand[] = ["all", "following", "manual"];

  $effect(() => {
    if (group.value) {
      imageAutoExpand = group.value;
    }
  });
  onMount(() => {
    group.value = lumiSetting.value.imageAutoExpand || items[0];
  });
</script>

<div {...group.root} class=" ml-8">
  <!-- svelte-ignore a11y_label_has_associated_control -- https://github.com/sveltejs/svelte/issues/15067 -->

  <label {...group.label} class=" flex gap-2 pt-1 my-2">
    <div class="w-[24px] h-[24px] flex justify-center items-center">
      <Circle size={16} class="fill-neutral-500 text-neutral-500" />
    </div>
    {$_("settings.display.imageAutoExpand.label")}
  </label>

  <div class=" ml-7 pl-1 border-l-2 border-neutral-500/20 rounded-md">
    {#each items as i}
      {@const item = group.getItem(i)}
      <label
        {...item.attrs}
        class="flex items-center gap-3 p-2 rounded-lg
             cursor-pointer transition-colors
             "
      >
        <div class="relative flex items-center justify-center">
          <div
            class="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-500
                     {item.checked
              ? 'border-neutral-500 dark:border-neutral-400'
              : ''}"
          >
            {#if item.checked}
              <div
                class="w-2 h-2 rounded-full bg-neutral-500 dark:bg-neutral-400
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
