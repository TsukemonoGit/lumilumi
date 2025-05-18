<script lang="ts">
  import { parseText, type Part } from "$lib/func/content";
  import { nip19 } from "nostr-tools";
  import { viewMediaModal } from "$lib/stores/stores";
  import Link from "$lib/components/Elements/Link.svelte";
  import { _ } from "svelte-i18n";
  import DecodedContent from "$lib/components/NostrElements/kindEvents/DecodedContent.svelte";
  import ContentImage from "$lib/components/NostrElements/content/ContentImage.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { untrack } from "svelte";
  import UrlDisplay from "$lib/components/NostrElements/content/UrlDisplay.svelte";

  interface Props {
    text: string;
    tags: string[][];
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    tieKey: string | undefined;
    maxHeight?: number | undefined;
    zIndex?: number | undefined;
  }

  let {
    text,
    tags,
    displayMenu,
    depth,
    repostable,
    tieKey,
    maxHeight,
    zIndex,
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
  //ツイッターとかぶるすこも画像だけ拡大されて複数だったら横で次のやつ見れるようになってるらしい
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
  let imgError: boolean = $state(false);
  let imgLoad: boolean = $state(false);
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
        {tieKey}
        {zIndex}
      />{:else}{part.content}{/if}
  {:else if part.type === "url"}
    <UrlDisplay
      {part}
      {openModal}
    />{:else if part.type === "emoji"}{#if lumiSetting.get().showImg && !imgError}{#if !imgLoad}:{part.content}:{/if}<img
        height="24"
        loading="lazy"
        alt={`:${part.content}:`}
        src={part.url}
        title={`:${part.content}:`}
        class="inline h-[24px] object-contain m-0 overflow-hidden"
        onload={() => (imgLoad = true)}
        onerror={() => (imgError = true)}
      />{:else}:{part.content}:{/if}{:else if part.type === "hashtag"}
    <a
      aria-label={"Search for events containing the hashtag"}
      href={`/search?t=${part.url}`}
      class="underline text-magnum-300 break-all hover:opacity-80"
      >#{part.content}</a
    >
  {:else if part.type === "relay"}
    <a
      class="underline text-magnum-300 break-all hover:opacity-80"
      href={part.url ?? ""}>{part.content}</a
    >
  {:else if part.type === "nip"}
    <Link
      props={{ "aria-label": `External Links: ${part.url}` }}
      className="underline text-magnum-300 break-all hover:opacity-80"
      href={part.url ?? ""}>{part.content}</Link
    >{:else}<span
      class="whitespace-pre-wrap break-words"
      style="word-break: break-word;">{part.content}</span
    >{/if}{/each}
