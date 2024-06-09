<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  /** Internal helpers */

  import { fade } from "svelte/transition";
  import { X, SquarePen } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import { publishEvent } from "$lib/func/nostr";
  import { onDestroy } from "svelte";
  import { writable } from "svelte/store";
  let text: string = "";

  const {
    elements: {
      trigger,
      overlay,
      content,
      title,
      description,
      close,
      portalled,
    },
    states: { open },
  } = createDialog({
    forceVisible: true,
  });

  const postNote = async () => {
    console.log(text);
    if (text.trim().length > 0) {
      const newev: Nostr.EventParameters = {
        kind: 1,
        content: text.trim(),
      };

      await publishEvent(newev);
      //初期化
      text = "";
    }
  };
  // ダイアログが閉じるときにtextをリセット
  $: if (!$open) {
    text = "";
  }
</script>

<button
  use:melt={$trigger}
  class="inline-flex items-center justify-center rounded-full bg-white border border-magnum-700 p-3
  font-medium leading-none text-magnum-700 shadow hover:opacity-75"
>
  <SquarePen />
</button>

{#if $open}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
    />
    <div
      class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw]
            max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-neutral-900
            p-6 shadow-lg"
      use:melt={$content}
    >
      <h2 use:melt={$title} class="m-0 text-lg font-medium">Post Note</h2>

      <fieldset class="mb-4 flex items-center gap-5">
        <textarea
          class="inline-flex h-24 w-full flex-1 items-center justify-center
                    rounded-md border border-solid p-2 leading-none bg-neutral-800"
          id="note"
          bind:value={text}
          placeholder="いま どうしてる？"
        />
      </fieldset>

      <div class="mt-6 flex justify-end gap-4">
        <button
          use:melt={$close}
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
        >
          Cancel
        </button>
        <button
          use:melt={$close}
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900"
          on:click={postNote}
        >
          Post
        </button>
      </div>
      <button
        use:melt={$close}
        aria-label="close"
        class="absolute right-4 top-4 inline-flex h-6 w-6 appearance-none
                items-center justify-center rounded-full p-1 text-magnum-800
                hover:bg-magnum-100 focus:shadow-magnum-400"
      >
        <X class="size-4" />
      </button>
    </div>
  </div>
{/if}
