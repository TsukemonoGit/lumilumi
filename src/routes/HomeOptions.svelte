<script lang="ts">
  import { createRadioGroup, melt } from "@melt-ui/svelte";
  import { t as _ } from '@konemono/svelte5-i18n';
  import { writable } from "svelte/store";
  import { timelineFilter } from "$lib/stores/globalRunes.svelte";

  const optionsArr = [
    ["0", $_("filter.canversation.all")],
    ["1", $_("filter.canversation.onlyFollowee")],
    ["2", $_("filter.canversation.none")],
  ];

  const selected = writable<string>(
    optionsArr[timelineFilter.get().selectCanversation][0]
  );

  const {
    elements: { root, item, hiddenInput },
    helpers: { isChecked },
  } = createRadioGroup({
    defaultValue: optionsArr[timelineFilter.get().selectCanversation][0],
    value: selected,
  });
  // $: console.log(timelineFilter.get.adaptMute);
  selected.subscribe((value) => {
    if (value !== undefined && value !== null) {
      timelineFilter.update((cur) => {
        console.log(cur);
        return { ...cur, selectCanversation: Number(value) };
      });
    }
  });
</script>

<li class="mb-2">
  <div class="label">
    {$_("filter.menu.canversation")}
  </div>
  <div
    use:melt={$root}
    class="text-sm my-1 gap-1 flex flex-col data-[orientation=horizontal]:flex-row"
    aria-label="View density"
  >
    {#each optionsArr as [index, option]}
      <div class="flex items-center gap-3">
        <button
          use:melt={$item(index)}
          class="grid h-6 w-6 cursor-default place-items-center rounded-full border border-magnum-400 shadow-sm
hover:bg-magnum-800"
          id={option}
          aria-labelledby="{option}-label"
        >
          {#if $isChecked(index)}
            <div class="h-3 w-3 rounded-full bg-magnum-400"></div>
          {/if}
        </button>
        <label for={option} id="{option}-label">
          {option}
        </label>
      </div>
    {/each}
    <input name="line-height" use:melt={$hiddenInput} />
  </div>
</li>
