<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  /** Internal helpers */

  import { fade } from "svelte/transition";
  import { X, SquarePen, SmilePlus } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import { publishEvent } from "$lib/func/nostr";
  import { emojis, showImg } from "$lib/stores/stores";
  import { contentCheck } from "$lib/func/contentCheck";

  let text: string = "";
  let tags: string[][] = [];
  let cursorPosition: number = 0;
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
      const { text: checkedText, tags: checkedTags } = contentCheck(
        text.trim(),
        tags
      );
      const newev: Nostr.EventParameters = {
        kind: 1,
        content: checkedText,
        tags: checkedTags,
      };

      publishEvent(newev);

      // ダイアログを閉じる
      $open = false;
    }
  };
  // ダイアログが閉じるときにtextをリセットtagもリセット
  $: if (!$open) {
    text = "";
    tags = [];
  }

  const handleTextareaInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    cursorPosition = target.selectionStart;
  };

  let customReaction: string = "";
  let viewCustomEmojis: boolean;
  const handleClickEmoji = (e: string[]) => {
    const emojiTag = ["emoji", ...e];
    if (!tags.some((tag) => tag[0] === "emoji" && tag[1] === e[0])) {
      tags.push(emojiTag);
    }
    // カーソル位置にテキストを挿入
    const emojiText = `:${e[0]}:`;
    text =
      text.slice(0, cursorPosition) + emojiText + text.slice(cursorPosition);
    cursorPosition += emojiText.length;
  };
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
            max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-neutral-900
            p-6 shadow-lg"
      use:melt={$content}
    >
      <h2 use:melt={$title} class="m-0 text-lg font-medium">Post Note</h2>

      <fieldset class="mb-4 flex items-center gap-5">
        <textarea
          class="inline-flex h-24 w-full flex-1 items-center justify-center
                    rounded-sm border border-solid p-2 leading-none bg-neutral-800"
          id="note"
          bind:value={text}
          on:input={handleTextareaInput}
          on:click={handleTextareaInput}
          placeholder="いま どうしてる？"
        />
      </fieldset>

      <div class="mt-6 flex justify-end gap-4">
        {#if $emojis && $emojis.length > 0}
          {#if viewCustomEmojis}
            <input
              type="text"
              class="h-8 w-full rounded-md text-magnum-100 border-2
           'border-neutral-900'}"
              bind:value={customReaction}
            />
          {/if}
          <button
            on:click={() => {
              viewCustomEmojis = !viewCustomEmojis;
            }}
            class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
          >
            <SmilePlus
              size="20"
              class={viewCustomEmojis ? "fill-magnum-700" : ""}
            />
          </button>
        {/if}
        <button
          use:melt={$close}
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
        >
          Cancel
        </button>
        <button
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900"
          on:click={postNote}
        >
          Post
        </button>
      </div>

      {#if viewCustomEmojis}
        <div
          class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-48 overflow-y-auto"
        >
          {#each $emojis as e, index}
            {#if customReaction === "" || e[0]
                .toLowerCase()
                .includes(customReaction.toLowerCase())}
              <button
                on:click={() => handleClickEmoji(e)}
                class="rounded-md border m-0.5 p-2 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
              >
                {#if $showImg}
                  <img
                    loading="lazy"
                    class="h-4 object-contain justify-self-center"
                    src={e[1]}
                    alt={e[0]}
                  />{:else}{e[0]}{/if}
              </button>
            {/if}
          {/each}
        </div>
      {/if}
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
