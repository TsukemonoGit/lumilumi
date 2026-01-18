<script lang="ts">
  //import { parseText, type Part } from "$lib/func/content";
  import * as nip19 from "nostr-tools/nip19";
  import { viewMediaModal } from "$lib/stores/stores";
  import Link from "$lib/components/Elements/Link.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import DecodedContent from "$lib/components/NostrElements/kindEvents/DecodedContent.svelte";

  //import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  import UrlDisplay from "$lib/components/NostrElements/content/UrlDisplay.svelte";
  import * as Nostr from "nostr-typedef";
  import {
    parseContent,
    TokenType,
    type Token,
  } from "@konemono/nostr-content-parser";
  import CustomEmoji from "$lib/components/NostrElements/content/CustomEmoji.svelte";
  import { nipLink, parseNaddr } from "$lib/func/util";
  import { type CustomEmojiWithMeta } from "$lib/func/customEmoji";
  import { type ExtendedToken, type UrlTokenWithNumber } from "$lib/types";
  interface Props {
    event: Partial<Nostr.Event>;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;

    maxHeight?: number | undefined;
    zIndex?: number | undefined;
  }

  let {
    event,
    displayMenu,
    depth,
    repostable,

    maxHeight,
    zIndex,
  }: Props = $props();

  let text = $derived(event.content || "");
  let tags = $derived(event.tags || []);

  let parts: ExtendedToken[] = $derived.by(() => {
    let rawParts = parseContent(text, tags);
    let imageIndex = 0;

    return rawParts.map((token) => {
      if (token.type === "url" && token.metadata?.type === "image") {
        return {
          ...token,
          metadata: { ...token.metadata, number: imageIndex++ },
        } satisfies UrlTokenWithNumber;
      }
      return token;
    });
  });

  //ツイッターとかぶるすこも画像だけ拡大されて複数だったら横で次のやつ見れるようになってるらしい

  let mediaList = $derived(
    parts
      .filter((part) => part.type === "url")
      .map((p) => p.content)
      .filter((t) => t !== undefined),
  );

  const openModal = (index: number) => {
    $viewMediaModal = { index: index, mediaList: $state.snapshot(mediaList) };
    //console.log(index, $state.snapshot(mediaList));
  };

  const nip19Decode = (
    content: string | undefined,
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

  const arekore = (
    type: string,
    id: string,
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
      part.metadata!.plainNip19 as string,
    )}
    {#if decoded}
      <DecodedContent
        {maxHeight}
        {decoded}
        content={part.content}
        tags={event.tags}
        {displayMenu}
        depth={depth + 1}
        {repostable}
        {zIndex}
      />{:else}{part.content}{/if}
  {:else if part.type === TokenType.LEGACY_REFERENCE && part.metadata && part.metadata.tagType && part.metadata.referenceId}
    {@const decoded = arekore(
      part.metadata.tagType as string,
      part.metadata.referenceId as string,
    )}
    {#if decoded}
      <DecodedContent
        {maxHeight}
        {decoded}
        content={part.content}
        tags={event.tags}
        {displayMenu}
        depth={depth + 1}
        {repostable}
        {zIndex}
      />{:else}{part}{part.content}{/if}
  {:else if part.type === "url"}
    <UrlDisplay
      part={part as UrlTokenWithNumber}
      {openModal}
      author={event.pubkey || ""}
    />{:else if part.type === TokenType.CUSTOM_EMOJI && part.metadata.hasMetadata}
    <CustomEmoji part={part as CustomEmojiWithMeta} />
  {:else if part.type === "relay"}
    <a
      class="underline text-magnum-300 break-all hover:opacity-80"
      href={part.content ?? ""}>{part.content}</a
    >
  {:else if part.type === TokenType.NIP_IDENTIFIER}
    <Link
      props={{ "aria-label": `External Links: ${part.content}` }}
      className="underline text-magnum-300 break-all hover:opacity-80"
      href={nipLink((part.metadata!.number as string) ?? "")}
      >{part.content}</Link
    >{:else}<span
      class="inline whitespace-pre-wrap break-words"
      style="word-break: break-word;">{part.content}</span
    >{/if}{/each}
