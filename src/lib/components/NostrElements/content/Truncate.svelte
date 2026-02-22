<script lang="ts">
  import { useTruncate } from "$lib/func/useTruncate";
  import type { Snippet } from "svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import { writable } from "svelte/store";

  type Props = {
    maxHeight?: number;
    children: Snippet;
    depth: number;
    truncate?: Snippet;
    zIndex: number;
  } & (
    | { useDialog: true; dialogId: string; dialogContent: Snippet }
    | { useDialog?: false; dialogId?: never; dialogContent?: never }
  );

  let props: Props = $props();

  let threshold = $derived((props.maxHeight ?? 460) * 0.35);

  let isTruncated = $state(false);

  // svelte-ignore non_reactive_update
  let open = writable(false);
  function toggleShowMore() {
    $open = true;
  }

  let maxHeight = $derived(props.maxHeight ?? 460);
  let minHeight = $derived(maxHeight * 0.2);
  let contentHeight = $derived(
    Math.max(
      Math.floor(maxHeight * Math.pow(0.8, props.depth * 1.8)),
      minHeight,
    ),
  );
</script>

{#if contentHeight}
  <div
    {@attach useTruncate(() => ({
      maxHeight: contentHeight,
      isTruncated: (value) => (isTruncated = value),
      threshold,
    }))}
    class="mt-0.5 max-w-full relative overflow-x-hidden"
    style={!isTruncated
      ? `max-height: ${contentHeight + threshold}px; overflow-y: hidden;`
      : `max-height: ${contentHeight}px; overflow: hidden;`}
  >
    {@render props.children?.()}
    {#if isTruncated}
      <div class="truncate-overlay"></div>
    {/if}
  </div>
  {#if isTruncated}
    {#if props.truncate}
      {@render props.truncate()}
    {:else}
      <button
        onclick={toggleShowMore}
        class="h-8 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 px-4 font-medium leading-none text-zinc-200 w-full"
      >
        {$_("truncate.expand")}
      </button>
    {/if}
    {#if props.useDialog}
      <Dialog id={props.dialogId} bind:open zIndex={props.zIndex + 10}>
        {#snippet main()}
          {@render props.dialogContent()}
        {/snippet}
      </Dialog>
    {/if}
  {/if}
{/if}

<style>
  .truncate-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2rem;
    background: linear-gradient(
      to bottom,
      rgb(var(--color-neutral-900) / 0),
      rgb(var(--color-neutral-900) / 0.6)
    );
    pointer-events: none;
  }
</style>
