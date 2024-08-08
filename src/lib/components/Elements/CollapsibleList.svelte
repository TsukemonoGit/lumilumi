<script lang="ts">
  import Collapsible from "./Collapsible.svelte";

  export let title: string;
  export let amount: number;
</script>

<div class="border border-magnum-500 rounded-md break-all my-0.5 w-full">
  <Collapsible>
    <div slot="title" class="font-bold px-1">
      <span class="text-magnum-400">{title}</span>
      {amount}
    </div>
    <div slot="contentEle">
      <slot />
    </div>
  </Collapsible>
</div>
