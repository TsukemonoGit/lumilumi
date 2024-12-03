<!-- @migration-task Error while migrating Svelte code: Element with a slot='...' attribute must be a child of a component or a descendant of a custom element -->
<script lang="ts">
  import { parseText } from "$lib/func/content";
  import { nip19 } from "nostr-tools";
  import DecodedContent from "./DecodedContent.svelte";
  import { showImg, viewMediaModal } from "$lib/stores/stores";
  import Link from "$lib/components/Elements/Link.svelte";
  import OGP from "$lib/components/Elements/OGP.svelte";
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import { _ } from "svelte-i18n";
  import ContentImage from "./content/ContentImage.svelte";
  import CustomEmoji from "./content/CustomEmoji.svelte";
  import ClientTag from "./ClientTag.svelte";
  import Geohash from "../geohash/Geohash.svelte";
  import ProxyTag from "$lib/components/Elements/ProxyTag.svelte";

  import InvoiceCard from "./EventCard/InvoiceCard.svelte";

  interface Props {
    text: string;
    tags: string[][];
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    tieKey: string | undefined;
    isShowClientTag?: boolean;
  }

  let {
    text,
    tags,
    displayMenu,
    depth,
    repostable,
    tieKey,
    isShowClientTag = true,
  }: Props = $props();
  // export let text: string;
  // export let tags: string[][];
  // export let displayMenu: boolean;
  // export let depth: number;
  // export let repostable: boolean;
  // export let tieKey: string | undefined;
  // export let isShowClientTag: boolean = true;
  //プレビューにも使ってるからconstだとだめ
  let parts = $derived(parseText(text, tags));
  //$: console.log(parts);

  //ツイッターとかぶるすこも画像だけ拡大されて複数だったら横で次のやつ見れるようになってるらしい
  let mediaList = $derived(
    parts.filter(
      (part) => part.type === "image" //|| part.type === "movie" || part.type === "audio"
    )
  );

  //let modalIndex = 0;
  const openModal = (index: number) => {
    // modalIndex = index;
    // if (showModal) $showModal = true;
    //   console.log("viewmedia");
    $viewMediaModal = { index: index, mediaList: mediaList };
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
  let geohash = $derived(
    tags.find((tag) => tag[0] === "g" && tag.length > 1)?.[1]
  ); // string | undefined
  let proxy = $derived(tags.find((item) => item[0] === "proxy")); // string[] | undefined
</script>

<!-- <MediaDisplay
  bind:open={showModal}
  images={mediaList}
  bind:currentIndex={modalIndex}
/> -->

{#each parts as part}{#if part.type === "nip19"}{@const decoded = nip19Decode(
      part.url
    )}
    {#if decoded}
      <DecodedContent
        {decoded}
        content={part.content}
        {displayMenu}
        depth={depth + 1}
        {repostable}
        {tieKey}
      />{:else}{part.content}{/if}
  {:else if part.type === "image" && part.content}
    <ContentImage {part} {openModal} />
  {:else if part.type === "movie"}
    {#if $showImg}
      <video
        aria-label="video contents"
        controls
        src={part.content}
        class=" object-contain max-w-[min(20rem,100%)] max-h-80"
        ><track default kind="captions" /></video
      >
    {:else}<Link
        props={{ "aria-label": `External Links: ${part.url}` }}
        className="underline text-magnum-300 break-all hover:opacity-80"
        href={part.content ?? ""}
        >{#snippet content()}{part.content}{/snippet}</Link
      >{/if}{:else if part.type === "audio"}
    {#if $showImg}
      <audio
        aria-label="audio contents"
        controls
        src={part.content}
        class=" object-contain max-w-[min(20rem,100%)] max-h-80"
        ><track default kind="captions" /></audio
      >
    {:else}<Link
        props={{ "aria-label": `External Links: ${part.url}` }}
        className="underline text-magnum-300 break-all hover:opacity-80"
        href={part.content ?? ""}
        >{#snippet content()}{part.content}{/snippet}</Link
      >{/if}
  {:else if part.type === "url"}{#if $showImg}<OGP url={part.content ?? ""}
        >{#snippet renderContent(contents)}
          {#if contents.title !== "" || contents.image !== "" || contents.description !== ""}<!--OGP表示はTITLE必須にしておくと思ったけどそしたらXのOGPでてこなくなったから-->
            <OgpCard {contents} url={part.content ?? ""} />{:else}<Link
              props={{ "aria-label": `External Links: ${part.url}` }}
              className="underline text-magnum-300 break-all "
              href={part.content ?? ""}
              >{#snippet content()}{part.content ?? ""}{/snippet}</Link
            >{/if}{/snippet}
        {#snippet nodata()}
          <Link
            props={{ "aria-label": `External Links: ${part.url}` }}
            className="underline text-magnum-300 break-all hover:opacity-80"
            href={part.content ?? ""}
            >{#snippet content()}{part.content ?? ""}{/snippet}</Link
          >{/snippet}
      </OGP>{:else}<Link
        props={{ "aria-label": `External Links: ${part.url}` }}
        className="underline text-magnum-300 break-all hover:opacity-80"
        href={part.content ?? ""}
        >{#snippet content()}{part.content}{/snippet}</Link
      >{/if}{:else if part.type === "emoji"}
    <CustomEmoji {part} />
  {:else if part.type === "hashtag"}
    <a
      aria-label={"Search for events containing the hashtag"}
      href={`/search?t=${part.url}`}
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
      href={part.url ?? ""}>{#snippet content()}{part.content}{/snippet}</Link
    >{:else if part.type === "invoice" && part.content}
    <InvoiceCard invoice={part.content} />
  {:else}<span
      class="whitespace-pre-wrap break-words"
      style="word-break: break-word;">{part.content}</span
    >{/if}{/each}
<ClientTag {tags} {isShowClientTag} {depth} />
{#if geohash}
  <Geohash {geohash} />{/if}
{#if proxy}
  <ProxyTag proxyTag={proxy} />
{/if}
