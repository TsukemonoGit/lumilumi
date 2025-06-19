<script lang="ts">
  //import { parseText, type Part } from "$lib/func/content";
  import {
    parseContent,
    TokenType,
    type Token,
  } from "@konemono/nostr-content-parser";
  import * as nip19 from "nostr-tools/nip19";
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
  import * as Nostr from "nostr-typedef";
  import { nipLink, parseNaddr } from "$lib/func/util";

  interface Props {
    event: Partial<Nostr.Event>;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;

    isShowClientTag?: boolean;
    maxHeight?: number | undefined;
    zIndex?: number | undefined;
    displayTags?: boolean;
  }

  let {
    event,
    displayMenu,
    depth,
    repostable,

    isShowClientTag = true,
    maxHeight,
    zIndex,
    displayTags = true,
  }: Props = $props();

  let parts: Token[] = $state([]);

  let text = $derived(event.content || "");
  let tags = $derived(event.tags || []);

  //プレビューにも使ってるからconstだとだめ
  $effect(() => {
    if (text || tags) {
      untrack(async () => {
        parts = await parseContent(text, tags, { detectUrlType: true });
        // image URL の出現順に number を追加
        let imageIndex = 0;
        for (const token of parts) {
          if (
            token.type === TokenType.URL &&
            token.metadata?.type === "image"
          ) {
            token.metadata.number = imageIndex++;
          }
        }
      });
    }
  });

  let mediaList = $derived(
    parts
      .filter(
        (part) =>
          part.type === "url" && part.metadata && part.metadata.type === "image"
      )
      .map((p) => p.content)
      .filter((t) => t !== undefined)
  );

  const openModal = (index: number) => {
    $viewMediaModal = { index: index, mediaList: $state.snapshot(mediaList) };
    console.log(index, $state.snapshot(mediaList));
  };

  const nip19Decode = (
    content: string | undefined
  ): nip19.DecodedResult | undefined => {
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

  const arekore = (
    type: string,
    id: string
  ): nip19.DecodedResult | undefined => {
    try {
      switch (type) {
        case "a":
          return { type: "naddr", data: parseNaddr(["a", id]) };

        case "p":
          return { type: "npub", data: id };
        case "e":
          return { type: "note", data: id };
      }
    } catch (error) {
      return undefined;
    }
  };
</script>

{#each parts as part}{#if part.type === "nip19"}{@const decoded = nip19Decode(
      part.metadata!.plainNip19 as string
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
  {:else if part.type === TokenType.LEGACY_REFERENCE && part.metadata && part.metadata.tagType && part.metadata.referenceId}
    {@const decoded = arekore(
      part.metadata.tagType as string,
      part.metadata.referenceId as string
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
      />{:else}{part}{part.content}{/if}
  {:else if part.type === "url"}
    <UrlDisplay {part} {openModal} author={event.pubkey || ""} />
  {:else if part.type === TokenType.CUSTOM_EMOJI}
    <CustomEmoji {part} />
  {:else if part.type === "hashtag"}
    <a
      aria-label={"Search for events containing the hashtag"}
      href={`/search?t=${part.metadata!.tag}&k=${event.kind || 1}`}
      class="underline text-magnum-300 break-all">{part.content}</a
    >
  {:else if part.type === "relay"}
    <a class="underline text-magnum-300 break-all" href={part.content ?? ""}
      >{part.content}</a
    >
  {:else if part.type === TokenType.NIP_IDENTIFIER}
    <Link
      props={{ "aria-label": `External Links: ${part.content}` }}
      className="underline text-magnum-300 break-all hover:opacity-80"
      href={nipLink(part.content ?? "")}>{part.content}</Link
    >{:else if part.type === TokenType.LNBC && part.content}
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
