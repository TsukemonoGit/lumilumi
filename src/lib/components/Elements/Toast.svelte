<script lang="ts" module>
  import type { ToastData } from "$lib/types";
  import { Toaster } from "melt/builders";

  const toaster = new Toaster<ToastData>({
    closeDelay: 7000, // 全てのトーストのデフォルト表示時間（ミリ秒）
  });

  export const addToast = (args: { data: ToastData; duration?: number }) => {
    toaster.addToast({
      data: args.data,
      ...(args.duration !== undefined && { duration: args.duration }),
    });
  };
  export { toaster };
</script>

<script lang="ts">
  import { flip } from "svelte/animate";
  import { fly } from "svelte/transition";
  import X from "lucide-svelte/icons/x";
  import ReactionToastLayout from "./ReactionToastLayout.svelte";
  import * as Nostr from "nostr-typedef";
  import { reactionToast } from "$lib/stores/stores";

  // reactionToast購読を統合
  reactionToast.subscribe((value) => {
    if (
      value &&
      !(
        (!value.title || value.title === "") &&
        (!value.description || value.description === "")
      )
    ) {
      toaster.addToast({
        data: value,
      });
      if (toaster.toasts.length > 4) {
        console.log(toaster.toasts);
        toaster.removeToast(toaster.toasts[toaster.toasts.length - 1].id);
      }
    }
  });

  const getEvent = (data: ToastData): Nostr.Event | undefined => {
    try {
      return JSON.parse(data.description || "") as Nostr.Event;
    } catch (error) {
      return;
    }
  };
</script>

<div {...toaster.root}>
  <div class="toast">
    {#each toaster.toasts as toast (toast.id)}
      {@const event = getEvent(toast.data)}

      <div
        {...toast.content}
        animate:flip={{ duration: 500 }}
        in:fly={{ duration: 200, x: 100 }}
        out:fly={{ duration: 200, x: 100 }}
        class="rounded-lg bg-neutral-800 text-white shadow-md p-1 max-h-26 {toast
          .data.color || ''}"
      >
        <div
          class="relative flex flex-col w-[16rem] max-w-[calc(100vw-2rem)] gap-1 text-sm"
        >
          {#if event}
            <ReactionToastLayout {event} />
          {:else}
            <div>
              {#if toast.data.title}
                <h3 {...toast.title} class="font-semibold">
                  {toast.data.title}
                </h3>
              {/if}
              {#if toast.data.description}
                <div {...toast.description} class="text-sm opacity-90">
                  {toast.data.description}
                </div>
              {/if}
            </div>

            {#if toast.data.action}
              <button
                on:click={() => {
                  toast.data.action?.onClick();
                  toaster.removeToast(toast.id);
                }}
                class="px-1 py-1 bg-white/20 hover:bg-white/30 rounded text-sm"
              >
                {toast.data.action.label}
              </button>
            {/if}
          {/if}

          <button
            {...toast.close}
            class="absolute right-0 top-0 grid size-6 place-items-center rounded-full text-white/70 hover:bg-white/10"
            aria-label="dismiss alert"
          >
            <X class="size-4" />
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .toast {
    position: fixed;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end; /* items-end */
    gap: 0.5rem; /* gap-2 */
  }
  [data-melt-toaster-root] {
    background: inherit; /* bg-inherit */
    overflow: visible; /* overflow-visible */
  }
</style>
