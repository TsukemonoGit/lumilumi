<script lang="ts">
  import { TriangleAlert } from "lucide-svelte";
  import { createSlider, melt } from "@melt-ui/svelte";

  export let text: string;

  const {
    elements: { root, range, thumbs },
    states: { value },
  } = createSlider({
    defaultValue: [0],
    min: 0,
    max: 100,
    step: 1,
  });
</script>

<div
  class="rounded-md border border-magnum-500/40 absolute top-0 left-0 w-full h-full bg-neutral-800 {$value[0] >=
  50
    ? 'pointer-events-none'
    : ''}"
  style=" opacity:{1 - $value[0] / 100}"
>
  <!-- TriangleAlertアイコン 
 <TriangleAlert
 size={"100%"}
 class="relative text-magnum-500/35 min-w-4  left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-52"
/>-->
  <!-- スクロール可能なテキスト領域 -->
  <div
    class="absolute w-full top-0 text-magnum-500 font-bold text-xs flex justify-center items-center gap-1"
  >
    <!-- TriangleAlertアイコン -->
    <TriangleAlert size="16" />WARNING<TriangleAlert size="16" />
  </div>
  <div
    class="absolute w-full max-h-[calc(100%-24px)] overflow-y-auto text-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-magnum-100 text-sm p-1"
  >
    {text}
  </div>
</div>

<span
  use:melt={$root}
  class="relative flex h-[24px] w-[calc(100%-24px)] mx-auto items-center"
>
  <span class="h-[3px] w-full bg-magnum-100/40">
    <span use:melt={$range} class="h-[3px] bg-neutral-900/80" />
  </span>

  <span
    use:melt={$thumbs[0]}
    class="h-5 w-5 rounded-full bg-magnum-500 focus:ring-4 focus:!ring-magnum-400/40"
  />
</span>
