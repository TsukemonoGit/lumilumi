<script lang="ts">
  import { parseText } from "$lib/func/content";
  import { nip19 } from "nostr-tools";
  import DecodedContent from "./DecodedContent.svelte";
  import { showImg } from "$lib/stores/stores";

  export let text: string;
  export let tags: string[][];
  /** ImageFile_Check_正規表現_パターン */
  const imageRegex = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;
  //movie
  const movieRegex = /\.(avi|mp4|mov|wmv|flv|mpg)$/i;

  const parts: {
    type: string;
    content: string | undefined;
    url?: string | undefined;
  }[] = parseText(text, tags);

  const nip19Decode = (
    content: string | undefined
  ):
    | { type: "naddr"; data: nip19.AddressPointer }
    | { type: "nevent"; data: nip19.EventPointer }
    | { type: "nprofile"; data: nip19.ProfilePointer }
    | { type: "nsec"; data: Uint8Array }
    | { type: "nrelay" | "npub" | "note"; data: string }
    | undefined => {
    if (content === undefined) {
      return undefined;
    }
    // console.log(content);
    try {
      const decoded: nip19.DecodeResult = nip19.decode(content);
      if (decoded.type === "naddr") {
        return {
          type: decoded.type,
          data: decoded.data as nip19.AddressPointer,
        };
      } else if (decoded.type === "nevent") {
        return { type: decoded.type, data: decoded.data as nip19.EventPointer };
      } else if (decoded.type === "nprofile") {
        return {
          type: decoded.type,
          data: decoded.data as nip19.ProfilePointer,
        };
      } else if (decoded.type === "nsec") {
        return { type: decoded.type, data: decoded.data as Uint8Array };
      } else {
        return { type: decoded.type, data: decoded.data as string };
      }
    } catch (error) {
      return undefined;
    }
  };
</script>

<div class="">
  {#each parts as part}
    {#if part.type === "nip19"}
      {#await nip19Decode(part.content) then decoded}
        {#if decoded}
          <DecodedContent {decoded} />
        {/if}
      {/await}
    {:else if part.type === "url" && part.content}
      {#if $showImg && imageRegex.test(part.content)}
        <img
          alt="img"
          src={part.content}
          class="max-w-full max-h-42 object-contain"
        />
      {:else if $showImg && movieRegex.test(part.content)}
        <video controls src={part.content}>
          <track default kind="captions" />
        </video>
      {:else}
        <a
          class="underline text-magnum-300 break-all"
          href={part.content}
          target="_blank"
          rel="noopener noreferrer">{part.content}</a
        >{/if}
    {:else if part.type === "emoji"}
      {#if $showImg}
        <img
          alt={part.content}
          src={part.url}
          class="inline h-8 object-contain"
        />
      {:else}
        :{part.content}:
      {/if}
    {:else}
      <span
        class="whitespace-pre-wrap break-words word"
        style="word-break: break-word;">{part.content}</span
      >
    {/if}
  {/each}
</div>
