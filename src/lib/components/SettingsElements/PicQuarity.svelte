<script lang="ts">
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { Slider } from "melt/builders";

  interface Props {
    value: number;
  }

  let { value = $bindable() }: Props = $props();

  const slider = new Slider({
    min: 10,
    max: 100,
    step: 5,
    value: () => value || lumiSetting.get().picQuarity || 100,
    onValueChange: (v) => {
      value = v;
    },
  });
</script>

<div
  class="slider-container relative flex h-[20px] w-[200px] items-center"
  {...slider.root}
>
  <div class="slider-track h-[3px] w-full bg-magnum-600/40 relative">
    <div
      class="slider-range h-[3px] bg-magnum-600 absolute inset-0 right-[var(--percentage-inv)]"
    ></div>
  </div>

  <div
    {...slider.thumb}
    class="h-5 w-5 rounded-full bg-magnum-400 focus:ring-4 focus:ring-magnum-400/40 absolute top-1/2 left-[var(--percentage)] -translate-x-1/2 -translate-y-1/2"
  ></div>
</div>

<style>
  .slider-container {
    position: relative;
  }

  .slider-track {
    position: relative;
    width: 100%;
  }

  .slider-range {
    position: absolute;
    inset: 0;
    right: var(--percentage-inv);
  }
</style>
