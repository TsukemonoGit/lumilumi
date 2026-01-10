<!--Dialog.svelte-->
<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { untrack, type Snippet } from "svelte";

  import { pushState } from "$app/navigation";
  import { popStack } from "$lib/stores/stores";
  import CloseButton from "./CloseButton.svelte";
  import { fade } from "svelte/transition";

  interface Props {
    title?: Snippet;
    main?: Snippet;
    footer?: Snippet<[{ close: () => void }]>;
    open?: boolean;
    zIndex?: number;
    id: string;
    closeOnOutsideClick?: boolean;
    contentClass?: string;
  }

  let {
    open = $bindable(false),
    title,
    main,
    footer,
    zIndex = 10,
    id,
    closeOnOutsideClick = true,
    contentClass = "",
  }: Props = $props();

  let scrollContainer: HTMLDivElement | null = $state(null);

  const resetScrollPosition = () => {
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  };

  const closeDialog = () => {
    open = false;
    popStack.update((stack) => stack.filter((entry) => entry.id !== id));
  };

  // ダイアログ開放時のスクロール位置リセット
  $effect(() => {
    if (open && scrollContainer) {
      setTimeout(resetScrollPosition, 0);
    }
  });

  // ブラウザバック処理
  $effect(() => {
    const isCurrentDialog = $popStack?.[0]?.id === id;
    if (isCurrentDialog) {
      untrack(() => (open = false));
    }
  });
</script>

<DialogPrimitive.Root
  bind:open
  onOpenChange={(value) => {
    if (value) {
      pushState("", { dialogOpen: { id } });
    } else {
      popStack.update((stack) => stack.filter((entry) => entry.id !== id));
    }
  }}
>
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      class={`fixed inset-0 bg-black/50 z-[${zIndex}]`}
    />
    <DialogPrimitive.Content
      forceMount
      preventScroll={false}
      class="fixed left-1/2 top-1/2 max-h-[90vh] w-[calc(min(96vw,720px))]
             -translate-x-1/2 -translate-y-1/2 rounded-xl bg-neutral-900
             p-2 sm:p-6 shadow-lg overflow-hidden flex flex-col z-[${zIndex}] {contentClass}"
      interactOutsideBehavior={closeOnOutsideClick ? "close" : "ignore"}
    >
      {#snippet child({ props, open: dialogOpen })}
        {#if dialogOpen}
          <div {...props} transition:fade={{ duration: 100 }}>
            <!-- ヘッダー -->
            {#if title}
              <DialogPrimitive.Title class="m-0 text-lg font-medium">
                {@render title?.()}
              </DialogPrimitive.Title>
            {/if}

            <!-- メインコンテンツ -->
            <div class="flex-1 overflow-auto" bind:this={scrollContainer}>
              {@render main?.()}
            </div>

            <!-- フッター -->
            {#if footer}
              {@render footer({ close: closeDialog })}
            {:else}
              <div class="mt-4 flex justify-end gap-4">
                <DialogPrimitive.Close
                  class="inline-flex h-8 items-center justify-center rounded-sm
                   bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
                >
                  Close
                </DialogPrimitive.Close>
              </div>
            {/if}

            <!-- 閉じるボタン -->
            <CloseButton
              onclick={() => (open = false)}
              zIndex={zIndex + 1}
              ariaLabel="close"
            />
          </div>
        {/if}
      {/snippet}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>
