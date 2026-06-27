<script lang="ts">
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { createSlider, melt } from "@melt-ui/svelte";

  interface Props {
    value: number;
  }
  let { value = $bindable() }: Props = $props();

  const {
    elements: { root, range, thumbs, ticks },
    states: { value: sliderValue },
  } = createSlider({
    defaultValue: [lumiSetting.get().picQuarity || 100],
    min: 10,
    step: 5,
    max: 100,
  });

  sliderValue.subscribe((v) => {
    //console.log(v);
    value = v[0];
  });
  // $inspect(value);
</script>

<span use:melt={$root} class="relative flex h-[20px] w-full items-center mb-2">
  <span class="h-[5px] w-full bg-neutral-600/40">
    <span use:melt={$range} class="h-[5px] rounded-full bg-neutral-600"></span>
  </span>

  {#each $ticks as tick}
    <span
      use:melt={tick}
      class="h-[3px] w-[1px] bg-neutral-600/50 data-[bounded]:bg-neutral-500/75"
    ></span>
  {/each}

  <span
    use:melt={$thumbs[0]}
    class="h-5 w-5 rounded-full bg-neutral-300 focus:ring-4 focus:!ring-neutral-300/40"
  ></span>
</span>
