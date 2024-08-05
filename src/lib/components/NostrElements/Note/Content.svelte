<script lang="ts">
  import { parseText } from "$lib/func/content";
  import { nip19 } from "nostr-tools";
  import DecodedContent from "./DecodedContent.svelte";
  import { showImg } from "$lib/stores/stores";
  import Link from "$lib/components/Elements/Link.svelte";
  import OGP from "$lib/components/Elements/OGP.svelte";
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import MediaDisplay from "$lib/components/Elements/MediaDisplay.svelte";

  export let text: string;
  export let tags: string[][];
  export let displayMenu: boolean;
  export let depth: number;
  //プレビューにも使ってるからconstだとだめ
  $: parts = parseText(text, tags);

  //ツイッターとかぶるすこも画像だけ拡大されて複数だったら横で次のやつ見れるようになってるらしい
  $: mediaList = parts.filter(
    (part) => part.type === "image" //|| part.type === "movie" || part.type === "audio"
  );

  let showModal: {
    update: (
      updater: import("svelte/store").Updater<boolean>,
      sideEffect?: ((newValue: boolean) => void) | undefined
    ) => void;
    set: (this: void, value: boolean) => void;
    subscribe(
      this: void,
      run: import("svelte/store").Subscriber<boolean>,
      invalidate?: import("svelte/store").Invalidator<boolean> | undefined
    ): import("svelte/store").Unsubscriber;
    get: () => boolean;
  };

  let modalIndex = 0;
  const openModal = (index: number) => {
    modalIndex = index;
    if (showModal) $showModal = true;
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
</script>

<MediaDisplay
  bind:open={showModal}
  images={mediaList}
  bind:currentIndex={modalIndex}
/>

{#each parts as part}
  {#if part.type === "nip19"}
    {#await nip19Decode(part.url) then decoded}
      {#if decoded}
        <DecodedContent
          {decoded}
          content={part.content}
          {displayMenu}
          depth={depth + 1}
        />
      {:else}
        {part.content}
      {/if}
    {/await}
  {:else if part.type === "image" && part.content}
    {#if $showImg}
      {#if !imgError}<button
          class="w-fit h-fit"
          on:click={() => openModal(part.number ?? 0)}
          ><img
            loading="lazy"
            alt="img"
            src={part.content}
            class=" max-w-[min(20rem,100%)] max-h-full object-contain"
            on:error={() => (imgError = true)}
          /></button
        >{:else}<Link
          className="underline text-magnum-300 break-all "
          href={part.content}>{part.content}</Link
        >{/if}
    {:else}
      <Link className="underline text-magnum-300 break-all " href={part.content}
        >{part.content}</Link
      >{/if}
  {:else if part.type === "movie"}
    {#if $showImg}
      <!-- <button
        class="w-fit h-fit"
        on:click|stopPropagation={() => openModal(part.number ?? 0)}
      > -->
      <video
        controls
        src={part.content}
        class=" object-contain max-w-[min(20rem,100%)] max-h-80"
      >
        <track default kind="captions" />
      </video>
      <!-- </button> -->
    {:else}
      <Link
        className="underline text-magnum-300 break-all "
        href={part.content ?? ""}>{part.content}</Link
      >{/if}{:else if part.type === "audio"}
    {#if $showImg}
      <!-- <button
        class="w-fit h-fit"
        on:click|stopPropagation={() => openModal(part.number ?? 0)}
        > -->
      <audio
        controls
        src={part.content}
        class=" object-contain max-w-[min(20rem,100%)] max-h-80"
      >
        <track default kind="captions" />
      </audio>
      <!-- </button
      > -->
    {:else}
      <Link
        className="underline text-magnum-300 break-all "
        href={part.content ?? ""}>{part.content}</Link
      >{/if}
  {:else if part.type === "url"}{#if $showImg}
      <OGP url={part.content ?? ""} let:contents>
        <Link
          slot="nodata"
          className="underline text-magnum-300 break-all "
          href={part.content ?? ""}>{part.content}</Link
        >
        {#if contents.title !== "" || contents.image !== "" || contents.description !== ""}<!--OGP表示はTITLE必須にしておくと思ったけどそしたらXのOGPでてこなくなったから-->
          <OgpCard {contents} url={part.content ?? ""} />
        {:else}
          <Link
            slot="nodata"
            className="underline text-magnum-300 break-all "
            href={part.content ?? ""}>{part.content ?? ""}</Link
          >
        {/if}
      </OGP>
    {:else}
      <Link
        className="underline text-magnum-300 break-all "
        href={part.content ?? ""}>{part.content}</Link
      >{/if}
  {:else if part.type === "emoji"}
    {#if $showImg}
      <img
        loading="lazy"
        alt={`:${part.content}:`}
        src={part.url}
        title={`:${part.content}:`}
        class="inline h-[24px] object-contain m-0 overflow-hidden"
      />
    {:else}
      :{part.content}:
    {/if}
  {:else if part.type === "hashtag"}
    <a
      href={`/search?t=${part.content}`}
      class="underline text-magnum-300 break-all">#{part.content}</a
    >
  {:else if part.type === "nip"}
    <Link className="underline text-magnum-300 break-all" href={part.url ?? ""}
      >{part.content}</Link
    >
  {:else}
    <span
      class="whitespace-pre-wrap break-words word align-middle"
      style="word-break: break-word;">{part.content}</span
    >
  {/if}
{/each}
