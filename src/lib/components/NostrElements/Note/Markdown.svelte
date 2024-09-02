<script lang="ts">
  import { parseMarkdownText, parseText } from "$lib/func/content";
  import { nip19 } from "nostr-tools";
  import DecodedContent from "./DecodedContent.svelte";
  import { showImg, viewMediaModal } from "$lib/stores/stores";
  import Link from "$lib/components/Elements/Link.svelte";
  import OGP from "$lib/components/Elements/OGP.svelte";
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import { _ } from "svelte-i18n";
  import Markdown2 from "./Markdown2.svelte";
  import Content from "./Content.svelte";

  export let text: string;
  export let tags: string[][];
  export let displayMenu: boolean;
  export let depth: number;
  export let repostable: boolean;
  //プレビューにも使ってるからconstだとだめ
  $: parts = parseMarkdownText(text, tags);

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
</script>

<!-- <MediaDisplay
  bind:open={showModal}
  images={mediaList}
  bind:currentIndex={modalIndex}
/> -->

{#each parts as part}
  {#if part.type === "nip19"}
    {@const decoded = nip19Decode(part.url)}
    {#if decoded}
      <DecodedContent
        {decoded}
        content={part.content}
        {displayMenu}
        depth={depth + 1}
        {repostable}
      />{:else}{part.content}{/if}
  {:else if part.type === "horizontal"}
    <hr />{:else if part.type === "quote"}
    <blockquote>
      <Content
        text={part.content ?? ""}
        {tags}
        {displayMenu}
        {depth}
        {repostable}
      />
    </blockquote>{:else if part.type === "unorderedList"}
    <ul>
      <li>
        <Markdown2
          text={part.content ?? ""}
          {tags}
          {displayMenu}
          {depth}
          {repostable}
        />
      </li>
    </ul>
  {:else if part.type === "table"}
    <table class="markdown-table">
      <thead>
        <tr>
          {#each part.headers ?? [] as header}
            <th class="table-header">{header}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each part.rows ?? [] as row}
          <tr>
            {#each row as cell}
              <td class="table-cell"
                ><Markdown2
                  text={cell}
                  {tags}
                  {displayMenu}
                  {depth}
                  {repostable}
                /></td
              >
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {:else if part.type === "bold"}
    <b>{part.content}</b>
  {:else if part.type === "header" && part.number}
    <div class="header-{part.number} mt-4">
      <Markdown2
        text={part.content ?? ""}
        {tags}
        {displayMenu}
        {depth}
        {repostable}
      />
    </div>
  {:else if part.type === "image" && part.content && part.url}
    {#if $showImg && !imgError}
      {#if !imgLoad}<Link
          props={{ "aria-label": `External Links: ${part.url}` }}
          className="underline text-magnum-300 break-all "
          href={part.url}>{part.content}</Link
        >{/if}
      <div>
        <button
          class="w-fit h-fit"
          aria-label={$_("alia.label.image")}
          on:click={() => openModal(part.number ?? 0)}
          ><img
            loading="lazy"
            width="288"
            height="288"
            alt="img"
            src={part.url}
            class=" max-w-[min(18rem,100%)] max-h-[18rem] object-contain"
            on:load={() => (imgLoad = true)}
            on:error={() => (imgError = true)}
          /></button
        >
      </div>{:else}<Link
        props={{ "aria-label": `External Links: ${part.url}` }}
        className="underline text-magnum-300 break-all "
        href={part.url}>{part.content}</Link
      >{/if}
  {:else if part.type === "movie"}
    {#if $showImg}
      <video
        aria-label="video contents"
        controls
        src={part.url}
        class=" object-contain max-w-[min(20rem,100%)] max-h-80"
        ><track default kind="captions" /></video
      >
    {:else}<Link
        props={{ "aria-label": `External Links: ${part.url}` }}
        className="underline text-magnum-300 break-all "
        href={part.url ?? ""}>{part.content}</Link
      >{/if}{:else if part.type === "audio"}
    {#if $showImg}
      <audio
        aria-label="audio contents"
        controls
        src={part.url}
        class=" object-contain max-w-[min(20rem,100%)] max-h-80"
        ><track default kind="captions" /></audio
      >
    {:else}<Link
        props={{ "aria-label": `External Links: ${part.url}` }}
        className="underline text-magnum-300 break-all "
        href={part.url ?? ""}>{part.content}</Link
      >{/if}
  {:else if part.type === "url"}<Link
      props={{ "aria-label": `External Links: ${part.url}` }}
      className="underline text-magnum-300 break-all "
      href={part.url ?? ""}>{part.content}</Link
    >{:else if part.type === "emoji"}
    {#if $showImg && !imgError}{#if !imgLoad}:{part.content}:{/if}<img
        height="24"
        loading="lazy"
        alt={`:${part.content}:`}
        src={part.url}
        title={`:${part.content}:`}
        class="inline h-[24px] object-contain m-0 overflow-hidden"
        on:load={() => (imgLoad = true)}
        on:error={() => (imgError = true)}
      />{:else}:{part.content}:{/if}
  {:else if part.type === "hashtag"}
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
    >{:else}
    <Content
      text={part.content ?? ""}
      {tags}
      {displayMenu}
      {depth}
      {repostable}
    />
  {/if}
{/each}

<style lang="postcss">
  .header-1 {
    @apply text-3xl font-bold mb-4;
  }

  .header-2 {
    @apply text-2xl font-semibold mb-4;
  }

  .header-3 {
    @apply text-xl font-semibold mb-3;
  }

  .header-4 {
    @apply text-lg font-medium mb-2;
  }
  /* テーブル全体のスタイル */
  .markdown-table {
    width: 100%;
    border-collapse: collapse; /* ボーダーを重ねて表示しない */
    margin: 20px 0;
  }

  /* ヘッダーセルのスタイル */
  .table-header {
    background-color: theme(colors.neutral.600);
    text-align: left;
    padding: 8px;
    border-bottom: 2px solid theme(colors.neutral.700);
  }

  /* ボディセルのスタイル */
  .table-cell {
    padding: 8px;
    border-bottom: 1px solid theme(colors.neutral.700);
  }

  /* テーブル行のスタイル */
  tr:nth-child(even) {
    background-color: theme(colors.neutral.800);
  }
  ul {
    list-style-type: disc; /* リストアイコンを表示 */
    margin-left: 1.5em; /* 左のマージンを追加 */
  }

  li {
    margin-bottom: 0.5em; /* 各リストアイテムの下にスペースを追加 */
  }
  blockquote {
    padding: 1em;
    margin: 1em 0;
    border-left: 5px solid rgb(var(--color-magnum-500) / 1); /* 引用の左側にカラーテーマに基づくライン */
    background-color: rgb(
      var(--color-neutral-800) / 1
    ); /* 背景色をカラーテーマに基づく */
    color: rgb(
      var(--color-neutral-50) / 1
    ); /* テキスト色をカラーテーマに基づく */
    font-style: italic;
    quotes: "“" "”" "‘" "’";
  }

  blockquote::before {
    content: open-quote;
    font-size: 2em;
    color: rgb(var(--color-magnum-500) / 1); /* カラーテーマに基づく */
    margin-right: 0.25em;
  }

  blockquote p {
    margin: 0;
  }

  blockquote::after {
    content: close-quote;
  }
</style>
