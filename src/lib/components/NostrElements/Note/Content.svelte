<script lang="ts">
  import { parseText } from "$lib/func/content";
  import { nip19 } from "nostr-tools";
  import DecodedContent from "./DecodedContent.svelte";
  import { showImg } from "$lib/stores/stores";
  import Link from "$lib/components/Elements/Link.svelte";
  import OGP from "$lib/components/Elements/OGP.svelte";
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import { isvalidURL } from "$lib/func/ogp";
  export let text: string;
  export let tags: string[][];
  export let displayMenu: boolean;
  export let depth: number;
  /** ImageFile_Check_正規表現_パターン */
  const imageRegex = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;
  //movie
  const movieRegex = /\.(avi|mp4|mov|wmv|flv|mpg)$/i;

  const audioRegex = /\.(mp3|wav|ogg|m4a)$/i;
  $: parts = parseText(text, tags);

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

  // パスから拡張子をチェックする関数
  const checkFileExtension = (url: string, regex: RegExp): boolean => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      return regex.test(path);
    } catch (error) {
      return false;
    }
  };
</script>

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
  {:else if part.type === "url" && part.content}
    {#if $showImg && checkFileExtension(part.content, imageRegex)}
      {#if !imgError}<Link href={part.content}
          ><img
            loading="lazy"
            alt="img"
            src={part.content}
            class=" max-w-[min(20rem,100%)] max-h-full object-contain"
            on:error={() => (imgError = true)}
          /></Link
        >{:else}<Link
          className="underline text-magnum-300 break-all "
          href={part.content}>{part.content}</Link
        >{/if}
    {:else if $showImg && checkFileExtension(part.content, movieRegex)}
      <Link href={part.content}
        ><video
          controls
          src={part.content}
          class=" object-contain max-w-[min(20rem,100%)] max-h-80"
        >
          <track default kind="captions" />
        </video></Link
      >{:else if $showImg && checkFileExtension(part.content, audioRegex)}
      <Link href={part.content}
        ><audio
          controls
          src={part.content}
          class=" object-contain max-w-[min(20rem,100%)] max-h-80"
        >
          <track default kind="captions" />
        </audio></Link
      >
    {:else if $showImg && isvalidURL(part.content)}
      <OGP url={part.content} let:contents>
        <Link
          slot="nodata"
          className="underline text-magnum-300 break-all "
          href={part.content}>{part.content}</Link
        >
        {#if contents.title !== "" || contents.image !== "" || contents.description !== ""}<!--OGP表示はTITLE必須にしておくと思ったけどそしたらXのOGPでてこなくなったから-->
          <OgpCard {contents} url={part.content} />
        {:else}
          <Link
            slot="nodata"
            className="underline text-magnum-300 break-all "
            href={part.content}>{part.content}</Link
          >
        {/if}
      </OGP>
    {:else}
      <Link className="underline text-magnum-300 break-all " href={part.content}
        >{part.content}</Link
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
