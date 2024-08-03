<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import Reaction from "./Reaction.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import { profile } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import ProxyTag from "$lib/components/Elements/ProxyTag.svelte";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import Link from "$lib/components/Elements/Link.svelte";
  import { showImg } from "$lib/stores/stores";
  import { isvalidURL } from "$lib/func/ogp";
  import OGP from "$lib/components/Elements/OGP.svelte";
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined;
  export let displayMenu: boolean;
  export let depth: number;
  export let proxy: string[] | undefined;

  $: website = reactionWebsite(note);
  function reactionWebsite(note: Nostr.Event): string | undefined {
    const webTag = note.tags.find((tag) => tag[0] === "r");
    if (webTag && webTag.length > 1) {
      return webTag[1];
    } else {
      return undefined;
    }
  }
</script>

<div class="flex gap-1 items-center bg-magnum-800/25">
  <div class="w-fit max-w-[40%]"><Reaction event={note} /></div>
  <div class="self-center">
    <UserMenu
      pubkey={note.pubkey}
      bind:metadata
      size={20}
      {displayMenu}
      {depth}
    />
  </div>
  <div class="break-all break-words whitespace-pre-line">
    {#if metadata}
      {profile(metadata)?.display_name ?? profile(metadata)?.name}<span
        class="text-magnum-100 text-sm mt-auto">@{profile(metadata)?.name}</span
      >
    {:else}
      <span class="text-magnum-100 text-sm"
        >@{nip19.npubEncode(note.pubkey)}</span
      >
    {/if}
  </div>
  {#if proxy}
    <div class="text-end">
      <ProxyTag proxyTag={proxy} />
    </div>
  {/if}
  <div class="ml-auto">
    {#if displayMenu}
      <NoteActionButtons {note} />{/if}
  </div>
</div>
<!--リアクションしたノートの情報（リポストのを使いまわし）-->

{#if website}
  <div class="p-2">
    {#if $showImg && isvalidURL(website)}
      <OGP url={website} let:contents>
        <Link
          slot="nodata"
          className="underline text-magnum-300 break-all "
          href={website}>{website}</Link
        >
        {#if contents.title !== "" || contents.image !== "" || contents.description !== ""}<!--OGP表示はTITLE必須にしておくと思ったけどそしたらXのOGPでてこなくなったから-->
          <OgpCard {contents} url={website} />
        {:else}
          <Link
            slot="nodata"
            className="underline text-magnum-300 break-all "
            href={website}>{website}</Link
          >
        {/if}
      </OGP>
    {:else}
      <Link className="underline text-magnum-300 break-all " href={website}
        >{website}</Link
      >{/if}
  </div>
{/if}
