<script lang="ts">
  import { parseText } from "$lib/func/content";
  import { nip19 } from "nostr-tools";
  import DecodedContent from "./DecodedContent.svelte";
  import { showImg, viewMediaModal, showClientTag } from "$lib/stores/stores";
  import Link from "$lib/components/Elements/Link.svelte";
  import OGP from "$lib/components/Elements/OGP.svelte";
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import { _ } from "svelte-i18n";
  import ContentImage from "./content/ContentImage.svelte";
  import { parseNaddr } from "$lib/func/util";

  export let text: string;
  export let tags: string[][];
  export let displayMenu: boolean;
  export let depth: number;
  export let repostable: boolean;
  export let tieKey: string | undefined;
  export let isShowClientTag: boolean = true;
  //プレビューにも使ってるからconstだとだめ
  $: parts = parseText(text, tags);

  //ツイッターとかぶるすこも画像だけ拡大されて複数だったら横で次のやつ見れるようになってるらしい
  $: mediaList = parts.filter(
    (part) => part.type === "image" //|| part.type === "movie" || part.type === "audio"
  );

  //let modalIndex = 0;
  const openModal = (index: number) => {
    // modalIndex = index;
    // if (showModal) $showModal = true;
    $viewMediaModal = { index: index, mediaList: mediaList };
  };

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

  let imgError: boolean = false;
  let imgLoad: boolean = false;

  $: clientTag = tags.find((tag) => tag[0] === "client");

  const onClickClientTag = (atag: string) => {
    const naddrAddress = parseNaddr(["a", atag]);
    const encoded = nip19.naddrEncode(naddrAddress);
    window.open(`https://nostrapp.link/a/${encoded}`, "_blank", "noreferrer");
  };
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
        className="underline text-magnum-300 break-all "
        href={part.content ?? ""}>{part.content}</Link
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
        className="underline text-magnum-300 break-all "
        href={part.content ?? ""}>{part.content}</Link
      >{/if}
  {:else if part.type === "url"}{#if $showImg}<OGP
        url={part.content ?? ""}
        let:contents
        ><Link
          props={{ "aria-label": `External Links: ${part.url}` }}
          slot="nodata"
          className="underline text-magnum-300 break-all "
          href={part.content ?? ""}>{part.content}</Link
        >{#if contents.title !== "" || contents.image !== "" || contents.description !== ""}<!--OGP表示はTITLE必須にしておくと思ったけどそしたらXのOGPでてこなくなったから-->
          <OgpCard {contents} url={part.content ?? ""} />{:else}<Link
            props={{ "aria-label": `External Links: ${part.url}` }}
            slot="nodata"
            className="underline text-magnum-300 break-all "
            href={part.content ?? ""}>{part.content ?? ""}</Link
          >{/if}</OGP
      >{:else}<Link
        props={{ "aria-label": `External Links: ${part.url}` }}
        className="underline text-magnum-300 break-all "
        href={part.content ?? ""}>{part.content}</Link
      >{/if}{:else if part.type === "emoji"}{#if $showImg && !imgError}{#if !imgLoad}:{part.content}:{/if}<img
        height="24"
        loading="lazy"
        alt={`:${part.content}:`}
        src={part.url}
        title={`:${part.content}:`}
        class="inline h-[24px] object-contain m-0 overflow-hidden"
        on:load={() => (imgLoad = true)}
        on:error={() => (imgError = true)}
      />{:else}:{part.content}:{/if}{:else if part.type === "hashtag"}
    <a
      aria-label={"Search for events containing the hashtag"}
      href={`/search?t=${part.url}`}
      class="underline text-magnum-300 break-all">#{part.content}</a
    >
  {:else if part.type === "nip"}
    <Link
      props={{ "aria-label": `External Links: ${part.url}` }}
      className="underline text-magnum-300 break-all"
      href={part.url ?? ""}>{part.content}</Link
    >{:else}<span
      class="whitespace-pre-wrap break-words"
      style="word-break: break-word;">{part.content}</span
    >{/if}{/each}
{#if isShowClientTag && $showClientTag && clientTag}
  {#if clientTag.length > 2}<button
      title={"open in nostrapp.link"}
      on:click={() => onClickClientTag(clientTag[2])}
      class={`inline ml-2 text-sm text-magnum-200/70 hover:underline`}
    >
      via {clientTag[1]}
    </button>{:else}<span class={`inline ml-2 text-sm  text-neutral-200/50`}>
      via {clientTag[1]}
    </span>{/if}{/if}
