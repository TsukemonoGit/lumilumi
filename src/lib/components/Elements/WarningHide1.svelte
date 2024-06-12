<script lang="ts">
  import { TriangleAlert } from "lucide-svelte";

  export let text: string;
</script>

<div class="absolute top-0 left-0 w-full h-full flex">
  <div
    class="rounded-sm resizable ml-auto mt-auto w-full h-full max-h-[100%] flex resize bg-magnum-600 z-20 overflow-hidden rotate-180"
  >
    <div class=" flex flex-auto justify-center items-center w-hull -rotate-180">
      <TriangleAlert size="20" class="text-magnum-300" />{text ??
        "warning"}<TriangleAlert size="20" class="text-magnum-300" />
    </div>
  </div>
</div>
