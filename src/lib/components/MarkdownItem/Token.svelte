<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";

  import SimpleContentBlock from "./SimpleContentBlock.svelte";

  interface Props {
    part: any;
    displayMenu: any;
    depth: any;
    repostable: any;
    note: any;
    openModal: any;
    nolist: boolean;
    //ツイッターとかぶるすこも画像だけ拡大されて複数だったら横で次のやつ見れるようになってるらしい

    zIndex?: number | undefined;
  }

  let {
    part,
    displayMenu,
    depth,
    repostable,
    note,

    nolist,

    zIndex,
  }: Props = $props();
</script>

<SimpleContentBlock
  {part}
  {repostable}
  {depth}
  {displayMenu}
  {note}
  {nolist}
  {zIndex}
/>
