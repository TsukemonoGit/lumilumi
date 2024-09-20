<script lang="ts">
  import { _ } from "svelte-i18n";

  import SimpleContentBlock from "./SimpleContentBlock.svelte";

  export let part;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
  export let openModal;
  export let nolist: boolean;
  //ツイッターとかぶるすこも画像だけ拡大されて複数だったら横で次のやつ見れるようになってるらしい

  export let tieKey: string | undefined;
</script>

<SimpleContentBlock
  {part}
  {repostable}
  {depth}
  {displayMenu}
  {tags}
  {openModal}
  {nolist}
  {tieKey}
/>
