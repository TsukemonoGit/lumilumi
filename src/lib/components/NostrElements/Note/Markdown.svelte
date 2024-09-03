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
  import ContentBlock from "./ContentBlock.svelte";

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
</script>

<!-- <MediaDisplay
  bind:open={showModal}
  images={mediaList}
  bind:currentIndex={modalIndex}
/> -->

{#each parts as part}
  <ContentBlock {part} {repostable} {depth} {displayMenu} {tags} {openModal} />
{/each}
