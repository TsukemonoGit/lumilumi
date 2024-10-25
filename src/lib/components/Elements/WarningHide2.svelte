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
  class="absolute top-0 left-0 w-full h-full flex bg-magnum-600 {$value[0] >= 50
    ? 'pointer-events-none'
    : ''}"
  style=" opacity:{1 - $value[0] / 100}"
>
  <div
    class=" grid grid-cols-[auto_1fr_auto] justify-between w-full overflow-hidden overflow-y-auto py-1"
  >
    <TriangleAlert size="20" class="text-magnum-300 min-w-4 " />
    <div class="w-full text-center">{text ?? "warning"}</div>
    <TriangleAlert size="20" class="text-magnum-300 min-w-4" />
  </div>
</div>
<span
  use:melt={$root}
  class="relative flex h-[24px] w-[95%] mx-auto items-center"
>
  <span class="h-[3px] w-full bg-magnum-100/40">
    <span use:melt={$range} class="h-[3px] bg-neutral-900/80" />
  </span>

  <span
    use:melt={$thumbs[0]}
    class="h-5 w-5 rounded-full bg-magnum-950 focus:ring-4 focus:!ring-magnum-300/40"
  />
</span>
