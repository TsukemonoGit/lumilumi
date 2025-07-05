<!--repostednote.svelte-->
<script lang="ts">
  import { parseNaddr } from "$lib/func/util";

  import Note from "../Note.svelte";
  import NaddrEvent from "../NaddrEvent.svelte";
  import { page } from "$app/state";

  interface Props {
    displayMenu: boolean;
    repostable: boolean;
    maxHeight: number | undefined;
    //tagはaかe
    tag: string[];
    zIndex?: number;
    depth: number;

    mini: boolean;
  }

  let {
    displayMenu,
    repostable,
    maxHeight,
    tag,
    depth,

    zIndex,
    mini,
  }: Props = $props();

  // 安全にtagの値を取得する関数
  let isValidETag = $derived(
    tag && Array.isArray(tag) && tag.length > 1 && tag[0] === "e"
  );
  let isValidATag = $derived(
    tag && Array.isArray(tag) && tag.length > 1 && tag[0] === "a"
  );
  let tagId = $derived(tag && tag.length > 1 ? tag[1] : undefined);
  let relayHint = $derived(
    tag && tag.length > 2 && tag[2]?.trim() !== "" ? [tag[2].trim()] : undefined
  );
</script>

{#if isValidETag && tagId}
  <Note
    relayhint={relayHint}
    id={tagId}
    {mini}
    {displayMenu}
    {depth}
    {repostable}
    {maxHeight}
    {zIndex}
    omit={page.route?.id === "/notifications" && depth === 1}
  />
{:else if isValidATag && tagId}
  <NaddrEvent
    data={parseNaddr(tag)}
    {displayMenu}
    {depth}
    {repostable}
    content={tagId}
    {zIndex}
    omit={page.route?.id === "/notifications" && depth === 1}
    mini={true}
  />
{:else}
  <!-- tagが無効な場合の表示 -->
  <div class="invalid-tag">
    {tag ? JSON.stringify(tag) : "No tag data"}
  </div>
{/if}
