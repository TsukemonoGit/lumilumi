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

  // $: bgColor = `bg-magnum-600/${$value}`;
  // $: bgColor = `rgba(249, 201, 120, ${1 - $value[0] / 100})`;
</script>

<div
  class="bgColor absolute top-0 left-0 w-full h-full flex bg-magnum-600 pointer-events-none"
  style=" opacity:{1 - $value[0] / 100}"
>
  <div class=" flex flex-auto justify-center items-center w-hull">
    <TriangleAlert size="20" class="text-magnum-300" />{text ??
      "warning"}<TriangleAlert size="20" class="text-magnum-300" />
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
