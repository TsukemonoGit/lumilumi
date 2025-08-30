<script lang="ts">
  import { createToaster, melt } from "@melt-ui/svelte";
  import { flip } from "svelte/animate";
  import { fly } from "svelte/transition";
  import X from "lucide-svelte/icons/x";
  import type { ToastData } from "$lib/types";
  import { reactionToast } from "$lib/stores/stores";
  import ReactionToastLayout from "./ReactionToastLayout.svelte";
  import * as Nostr from "nostr-typedef";

  const {
    elements: { content, title, description, close },
    helpers: { addToast, removeToast },
    states: { toasts },
    actions: { portal },
  } = createToaster<ToastData>();

  reactionToast.subscribe((value) => {
    if (
      value &&
      !(
        (!value.title || value.title === "") &&
        (!value.description || value.description === "")
      )
    ) {
      addToast({
        data: value,
      });
      if ($toasts.length > 5) {
        console.log($toasts);
        removeToast($toasts[$toasts.length - 1].id);
      }
    }
  });

  const getEvent = (data: ToastData): Nostr.Event | undefined => {
    try {
      return JSON.parse(data.description) as Nostr.Event;
    } catch (error) {
      return;
    }
  };
</script>

<div
  class="fixed right-0 top-0 z-[99] max-h-24 flex flex-col items-end gap-1 md:bottom-0 md:top-auto"
  use:portal
>
  {#each $toasts as { id, data } (id)}
    {@const event = getEvent(data)}

    <div
      use:melt={$content(id)}
      animate:flip={{ duration: 500 }}
      in:fly={{ duration: 150, x: "100%" }}
      out:fly={{ duration: 150, x: "100%" }}
      class="rounded-lg bg-neutral-800 text-white shadow-md p-1"
    >
      <div
        class="relative flex flex-col w-[16rem] max-w-[calc(100vw-2rem)] gap-1 text-sm"
      >
        {#if event}
          <ReactionToastLayout {event} />
        {/if}<button
          use:melt={$close(id)}
          class="absolute right-1 top-1 grid size-6 place-items-center rounded-full text-magnum-500
          hover:bg-magnum-900/50"
        >
          <X class="size-4" />
        </button>
      </div>
    </div>
  {/each}
</div>
