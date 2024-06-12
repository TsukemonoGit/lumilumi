<script lang="ts">
  import { parseText } from "$lib/func/content";
  import { nip19 } from "nostr-tools";
  import DecodedContent from "./DecodedContent.svelte";

  export let text: string;
  export let tags: string[][];

  const parts = parseText(text, tags);

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
    console.log(content);
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

<div>
  {#each parts as part}
    {#if part.type === "nip19"}
      {#await nip19Decode(part.content) then decoded}
        {#if decoded}
          <DecodedContent {decoded} />
        {/if}
      {/await}
    {:else if part.type === "url"}
      <a href={part.content} target="_blank" rel="noopener noreferrer"
        >{part.content}</a
      >
    {:else}
      <span>{part.content}</span>
    {/if}
  {/each}
</div>

<style>
  span {
    /* スパンのスタイルを必要に応じて追加 */
  }
  a {
    color: blue;
    text-decoration: underline;
  }
</style>
