<script lang="ts">
  import type { Part } from "$lib/func/content";
  import { showImg, viewMediaModal } from "$lib/stores/stores";
  import { _ } from "svelte-i18n";
  import Content from "../Note/Content.svelte";
  import DecodedContent from "../Note/DecodedContent.svelte";
  import { nip19Decode } from "$lib/func/util";
  import Link from "$lib/components/Elements/Link.svelte";
  import UnorderedList from "./UnorderedList.svelte";
  import Table from "./Table.svelte";
  import Markdown from "./Markdown.svelte";
  import { ExternalLink } from "lucide-svelte";
  import OrderedList from "./OrderedList.svelte";

  import SimpleMarkdown from "./SimpleMarkdown.svelte";
  import SimpleContentBlock from "./SimpleContentBlock.svelte";

  export let part;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
  export let openModal;
  export let nolist: boolean;
  //ツイッターとかぶるすこも画像だけ拡大されて複数だったら横で次のやつ見れるようになってるらしい

  let imgError: boolean = false;
  let imgLoad: boolean = false;
</script>

<SimpleContentBlock
  {part}
  {repostable}
  {depth}
  {displayMenu}
  {tags}
  {openModal}
  {nolist}
/>
