<script lang="ts">
  import { TriangleAlert } from "lucide-svelte";
  import { Slider } from "melt/builders";

  interface Props {
    text: string;
  }

  let { text }: Props = $props();
  let value = $state(0);

  const slider = new Slider({
    min: 0,
    max: 100,
    step: 1,
    value: () => value,
    onValueChange: (v) => (value = v),
  });
</script>

<div
  class="rounded-md border border-magnum-500/40 absolute top-0 left-0 w-full h-full bg-neutral-800"
  class:pointer-events-none={value >= 50}
  style="opacity:{1 - value / 100}"
>
  <div
    class="absolute w-full top-0 text-magnum-500 font-bold text-xs flex justify-center items-center gap-1"
  >
    <TriangleAlert size="16" />WARNING<TriangleAlert size="16" />
  </div>

  <div
    class="absolute w-full max-h-[calc(100%-24px)] overflow-y-auto text-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-magnum-100 text-sm p-1"
  >
    {text ?? ""}
  </div>
</div>

<div
  class="slider-container h-[24px] w-[calc(100%-24px)] mx-auto"
  {...slider.root}
>
  <div class="slider-track h-[3px] bg-magnum-100/40">
    <div class="slider-range h-[3px] bg-magnum-500"></div>
  </div>

  <div
    {...slider.thumb}
    class="slider-thumb h-5 w-5 rounded-full bg-magnum-500 focus:ring-4 focus:ring-magnum-400/40"
  ></div>
</div>

<style>
  .slider-container {
    position: relative;
    display: flex;
    align-items: center;
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

  .slider-thumb {
    position: absolute;
    top: 50%;
    left: var(--percentage);
    transform: translate(-50%, -50%);
  }
</style>
