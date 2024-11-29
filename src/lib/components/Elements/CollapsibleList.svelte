<script lang="ts">
  import Collapsible from "./Collapsible.svelte";

  interface Props {
    title: string;
    amount: number;
    children?: import("svelte").Snippet;
  }

  let { title, amount = $bindable(), children }: Props = $props();
</script>

<div class="border border-magnum-500 rounded-md break-all my-0.5 w-full">
  <Collapsible>
    {#snippet title()}
      <div class="font-bold px-1">
        <span class="text-magnum-400">{title}</span>
        {amount}
      </div>
    {/snippet}
    {#snippet contentEle()}
      <div>
        {@render children?.()}
      </div>
    {/snippet}
  </Collapsible>
</div>
