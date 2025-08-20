<script lang="ts">
  import type { ReqStatus } from "$lib/types";
  import Collapsible from "./Collapsible.svelte";

  interface Props {
    title: string;
    amount: number;
    children?: import("svelte").Snippet;
    status: ReqStatus;
  }

  let {
    title: header,
    amount = $bindable(),
    children,
    status,
  }: Props = $props();
</script>

<div class="border border-magnum-500 rounded-md break-all my-0.5 w-full">
  <Collapsible>
    {#snippet title()}
      <div class="font-bold px-1 flex items-center gap-2 w-full">
        <div class="text-magnum-400">{header}</div>
        <div>{amount}</div>
        {#if status === "loading"}
          <div
            class="ml-auto text-sm text-magnum-500/50 font-normal animate-pulse"
          >
            Loading...
          </div>
        {/if}
      </div>
    {/snippet}
    {#snippet contentEle()}
      <div>
        {@render children?.()}
      </div>
    {/snippet}
  </Collapsible>
</div>
