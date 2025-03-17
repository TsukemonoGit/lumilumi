<script lang="ts">
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { createSlider, melt } from "@melt-ui/svelte";
  import { onMount } from "svelte";
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

<span use:melt={$root} class="relative flex h-[20px] w-[200px] items-center">
  <span class="h-[3px] w-full bg-magnum-600/40">
    <span use:melt={$range} class="h-[3px] bg-magnum-600"></span>
  </span>

  {#each $ticks as tick}
    <span
      use:melt={tick}
      class="h-[3px] w-[3px] rounded-full bg-magnum-600/50 data-[bounded]:bg-magnum-500/75"
    ></span>
  {/each}

  <span
    use:melt={$thumbs[0]}
    class="h-5 w-5 rounded-full bg-magnum-300 focus:ring-4 focus:!ring-magnum-300/40"
  ></span>
</span>
