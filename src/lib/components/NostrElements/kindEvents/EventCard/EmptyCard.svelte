<script lang="ts">
  import { MessageSquare, Repeat2, Heart, Zap, Ellipsis } from "lucide-svelte";
</script>

<div
  class={"grid grid-cols-[auto_1fr] w-full overflow-hidden my-1 justify-start gap-1 pt-0.5 px-1"}
>
  <!--icon-->
  <div class="rounded-full bg-neutral-800 w-10 h-10"></div>

  <div class="pt-1 max-w-full overflow-hidden">
    <!--name-->
    <div
      class="flex items-center flex-wrap overflow-hidden w-24 h-5 bg-neutral-800"
    ></div>

    <!---->
    <div
      class="mt-1 w-full flex items-center flex-wrap overflow-hidden h-10 bg-neutral-800"
    ></div>
    <div class=" mt-1 flex justify-between text-neutral-600">
      <MessageSquare size="20" /><Repeat2 size="22" /><Heart
        size="20"
        class=" mt-auto overflow-hidden"
      />
      <Zap size="20" /><Ellipsis />
    </div>
  </div>
</div>
