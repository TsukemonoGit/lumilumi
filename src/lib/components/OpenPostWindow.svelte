<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import { X, SquarePen, SmilePlus, Send, TriangleAlert } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import { publishEvent } from "$lib/func/nostr";
  import {
    emojis,
    nowProgress,
    showImg,
    showPreview,
  } from "$lib/stores/stores";
  import { contentCheck } from "$lib/func/contentCheck";
  import Content from "./NostrElements/Note/Content.svelte";
  import UploaderSelect from "./Elements/UploaderSelect.svelte";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import MediaPicker from "./Elements/MediaPicker.svelte";
  import { filesUpload } from "$lib/func/util";
  import type { FileUploadResponse } from "nostr-tools/nip96";

  let defaultValue: string | undefined;
  let text: string = "";
  let tags: string[][] = [];
  let cursorPosition: number = 0;
  let onWarning: boolean;
  let warningText = "";
  let customReaction: string = "";
  let viewCustomEmojis: boolean;
  let selectedUploader: string;
  let files: FileList | undefined;
  let fileInput: HTMLInputElement | undefined;

  const { elements, states } = createDialog({ forceVisible: true });
  const { trigger, overlay, content, close, portalled } = elements;
  const { open } = states;

  onMount(() => {
    if (browser) {
      const tmp = localStorage.getItem("uploader");
      if (tmp) defaultValue = tmp;
    }
  });

  const postNote = async () => {
    if (text.trim().length > 0) {
      const { text: checkedText, tags: checkedTags } = contentCheck(
        text.trim(),
        tags
      );
      if (onWarning) checkedTags.push(["content-warning", warningText]);
      const newev: Nostr.EventParameters = {
        kind: 1,
        content: checkedText,
        tags: checkedTags,
      };

      publishEvent(newev);
      $open = false;
    }
  };

  $: if (!$open) {
    resetState();
  }

  const resetState = () => {
    text = "";
    tags = [];
    warningText = "";
    onWarning = false;
    viewCustomEmojis = false;
  };

  const handleTextareaInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    cursorPosition = target.selectionStart;
  };

  const handleClickEmoji = (e: string[]) => {
    const emojiTag = ["emoji", ...e];
    if (!tags.some((tag) => tag[0] === "emoji" && tag[1] === e[0])) {
      tags.push(emojiTag);
    }
    const emojiText = `:${e[0]}:`;
    text =
      text.slice(0, cursorPosition) + emojiText + text.slice(cursorPosition);
    cursorPosition += emojiText.length;
  };

  const handleFileUpload = async (fileList: FileList) => {
    if (!fileList || fileList.length <= 0 || !defaultValue) return;
    $nowProgress = true;
    const uploadedURPs: FileUploadResponse[] = await filesUpload(
      fileList,
      defaultValue
    );
    console.log(uploadedURPs);
    uploadedURPs.forEach((data) => {
      if (data.status === "success") {
        const url = data.nip94_event?.tags.find((tag) => tag[0] === "url")?.[1];
        if (url) {
          text =
            text.slice(0, cursorPosition) + url + text.slice(cursorPosition);
          cursorPosition += url.length;
        }
      }
    });
    $nowProgress = false;
  };

  const onChangeHandler = async (e: Event): Promise<void> => {
    const _files = (e.target as HTMLInputElement).files;
    if (_files) {
      await handleFileUpload(_files);
    }
  };

  const paste = async (event: ClipboardEvent) => {
    console.log("[paste]", event.type, event.clipboardData);
    if (!event.clipboardData) return;

    const files = [...event.clipboardData.items]
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    const fileList = new DataTransfer();
    files.forEach((file) => fileList.items.add(file));
    await handleFileUpload(fileList.files);
  };

  $: console.log(selectedUploader);
  $: if (selectedUploader) {
    defaultValue = selectedUploader;
  }

  let textarea: HTMLTextAreaElement;

  $: if ($open) {
    //開いたときにフォーカス
    textarea?.focus();
  }
</script>

<button
  use:melt={$trigger}
  class="inline-flex items-center justify-center rounded-full bg-white border border-magnum-700 p-3.5
  font-medium leading-none text-magnum-700 shadow hover:opacity-75"
>
  <SquarePen size={28} />
</button>

{#if $open}
  <div use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
    />
    <div
      class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw]
            max-w-[450px] -translate-x-1/2 -translate-y-1/2"
      use:melt={$content}
    >
      {#if $showImg && $showPreview && text !== ""}
        <div
          class="rounded-md bg-neutral-900
            p-6 shadow-lg mb-4"
        >
          <div class="font-medium">preview</div>
          <div
            class="content rounded-md border-magnum-500 border min-h-4 max-h-28 overflow-y-auto"
          >
            <Content bind:text bind:tags />
          </div>
        </div>
      {/if}
      <div class="rounded-md bg-neutral-900 p-6 shadow-lg">
        <div class="flex flex-row gap-2 mb-2">
          <MediaPicker bind:files bind:fileInput on:change={onChangeHandler} />

          <UploaderSelect bind:defaultValue bind:selectedUploader />
        </div>
        <fieldset class="mb-1 flex items-center gap-5">
          <textarea
            class="inline-flex h-24 w-full flex-1 items-center justify-center
                    rounded-sm border border-solid p-2 leading-none bg-neutral-800"
            id="note"
            bind:this={textarea}
            bind:value={text}
            on:input={handleTextareaInput}
            on:click={handleTextareaInput}
            on:paste={paste}
            placeholder="いま どうしてる？"
          />
        </fieldset>
        {#if onWarning}
          <div class="flex">
            <div class="mt-auto mb-auto text-sm break-keep">理由：</div>
            <input
              type="text"
              class="px-1 h-8 w-full rounded-md text-magnum-100 border-2
           'border-neutral-900'}"
              bind:value={warningText}
            />
          </div>
        {:else}<div class="h-4" />{/if}

        <div class="mt-2 flex justify-between">
          <button
            on:click={() => {
              onWarning = !onWarning;
            }}
            class=" h-8 rounded-sm
                bg-zinc-100 px-4 font-medium leading-none text-zinc-600 hover:opacity-75 focus:opacity-50"
          >
            <TriangleAlert
              size="20"
              class="stroke-magnum-500 {onWarning ? 'fill-magnum-700 ' : ''}"
            />
          </button>

          <div class=" flex gap-4">
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
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600 hover:opacity-75 focus:opacity-50"
              >
                <SmilePlus
                  size="20"
                  class={viewCustomEmojis
                    ? "fill-magnum-700 stroke-magnum-500"
                    : ""}
                />
              </button>
            {/if}

            <button
              class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900 hover:opacity-75 focus:opacity-50"
              on:click={postNote}
            >
              <Send size="20" />
            </button>
          </div>
        </div>

        {#if viewCustomEmojis}
          <div
            class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-40 overflow-y-auto"
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
          class="absolute right-0 top-1 inline-flex h-7 w-7 appearance-none
                items-center justify-center rounded-full text-magnum-800
                hover:bg-magnum-100 focus:shadow-magnum-400"
        >
          <X size={32} />
        </button>
      </div>
    </div>
  </div>
{/if}
