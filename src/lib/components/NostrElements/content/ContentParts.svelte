<script lang="ts">
  import { parseText, type Part } from "$lib/func/content";
  import { nip19 } from "nostr-tools";
  import DecodedContent from "../kindEvents/DecodedContent.svelte";
  import { viewMediaModal } from "$lib/stores/stores";
  import Link from "$lib/components/Elements/Link.svelte";

  import CustomEmoji from "./CustomEmoji.svelte";
  import ClientTag from "./ClientTag.svelte";
  import Geohash from "./geohash/Geohash.svelte";
  import ProxyTag from "$lib/components/NostrElements/content/ProxyTag.svelte";

  import InvoiceCard from "../kindEvents/EventCard/InvoiceCard.svelte";

  import { untrack } from "svelte";

  import UrlDisplay from "./UrlDisplay.svelte";

  interface Props {
    text: string;
    tags: string[][];
    displayMenu: boolean;
    depth: number;
    repostable: boolean;

    isShowClientTag?: boolean;
    maxHeight?: number | undefined;
    zIndex?: number | undefined;
    displayTags?: boolean;
    kind?: number;
  }

  let {
    text,
    tags,
    displayMenu,
    depth,
    repostable,

    isShowClientTag = true,
    maxHeight,
    zIndex,
    displayTags = true,
    kind = 1,
  }: Props = $props();

  let parts: Part[] = $state([]);
  //プレビューにも使ってるからconstだとだめ
  $effect(() => {
    if (text || tags) {
      untrack(async () => {
        parts = await parseText(text, tags);
      });
    }
  });

  let mediaList = $derived(
    parts
      .filter((part) => part.type === "url")
      .map((p) => p.url)
      .filter((t) => t !== undefined)
  );

  const openModal = (index: number) => {
    $viewMediaModal = { index: index, mediaList: $state.snapshot(mediaList) };
    console.log(index, $state.snapshot(mediaList));
  };

  const nip19Decode = (
    content: string | undefined
  ):
    | { type: "naddr"; data: nip19.AddressPointer }
    | { type: "nevent"; data: nip19.EventPointer }
    | { type: "nprofile"; data: nip19.ProfilePointer }
    | { type: "nsec"; data: Uint8Array }
    | { type: "npub" | "note"; data: string }
    | undefined => {
    if (content === undefined) {
      return undefined;
    }
    // console.log(content);
    try {
      const decoded = nip19.decode(content);
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
  let geohash = $derived(
    tags.find((tag) => tag[0] === "g" && tag.length > 1)?.[1]
  ); // string | undefined
  let proxy = $derived(tags.find((item) => item[0] === "proxy")); // string[] | undefined
</script>

{#each parts as part}{#if part.type === "nip19"}{@const decoded = nip19Decode(
      part.url
    )}
    {#if decoded}
      <DecodedContent
        {maxHeight}
        {decoded}
        content={part.content}
        {displayMenu}
        depth={depth + 1}
        {repostable}
        {zIndex}
      />{:else}{part.content}{/if}
  {:else if part.type === "url"}
    <UrlDisplay {part} {openModal} />
  {:else if part.type === "emoji"}
    <CustomEmoji {part} />
  {:else if part.type === "hashtag"}
    <a
      aria-label={"Search for events containing the hashtag"}
      href={`/search?t=${part.url}&k=${kind}`}
      class="underline text-magnum-300 break-all">#{part.content}</a
    >
  {:else if part.type === "relay"}
    <a class="underline text-magnum-300 break-all" href={part.url ?? ""}
      >{part.content}</a
    >
  {:else if part.type === "nip"}
    <Link
      props={{ "aria-label": `External Links: ${part.url}` }}
      className="underline text-magnum-300 break-all hover:opacity-80"
      href={part.url ?? ""}>{part.content}</Link
    >{:else if part.type === "invoice" && part.content}
    <InvoiceCard invoice={part.content} />
  {:else}<span
      class="whitespace-pre-wrap break-words"
      style="word-break: break-word;">{part.content}</span
    >{/if}{/each}
{#if displayTags}
  {#if geohash}
    <Geohash {geohash} />{/if}
  {#if proxy}
    <ProxyTag proxyTag={proxy} />
  {/if}
  <ClientTag {tags} {isShowClientTag} {depth} />
{/if}
