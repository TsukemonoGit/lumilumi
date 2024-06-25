<script lang="ts">
  import { parseText } from "$lib/func/content";
  import { nip19 } from "nostr-tools";
  import DecodedContent from "./DecodedContent.svelte";
  import { showImg } from "$lib/stores/stores";
  import Link from "../Elements/Link.svelte";

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

{#each parts as part}
  {#if part.type === "nip19"}
    {#await nip19Decode(part.content) then decoded}
      {#if decoded}
        <DecodedContent {decoded} content={part.content} />
      {/if}
    {/await}
  {:else if part.type === "url" && part.content}
    {#if $showImg && imageRegex.test(part.content)}
      <Link href={part.content}
        ><img
          loading="lazy"
          alt="img"
          src={part.content}
          class=" max-w-[min(20rem,100%)] max-h-full object-contain"
        /></Link
      >
    {:else if $showImg && movieRegex.test(part.content)}
      <Link href={part.content}
        ><video
          controls
          src={part.content}
          class=" object-contain max-w-[min(20rem,100%)] max-h-80"
        >
          <track default kind="captions" />
        </video></Link
      >
    {:else}
      <Link className="underline text-magnum-300 break-all" href={part.content}
        >{part.content}</Link
      >{/if}
  {:else if part.type === "emoji"}
    {#if $showImg}
      <img
        loading="lazy"
        alt={part.content}
        src={part.url}
        class="inline h-[24px] object-contain m-0 overflow-hidden"
      />
    {:else}
      :{part.content}:
    {/if}
  {:else}
    <span
      class="whitespace-pre-wrap break-words word align-middle"
      style="word-break: break-word;">{part.content}</span
    >
  {/if}
{/each}
