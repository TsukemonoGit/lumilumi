<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import Reaction from "./Reaction.svelte";

  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import Link from "$lib/components/Elements/Link.svelte";

  import { isvalidURL } from "$lib/func/ogp";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../user/UserPopupMenu.svelte";
  import ProfileDisplay from "./EventCard/ProfileDisplay.svelte";
  import RepostComponent from "./layout/RepostComponent.svelte";
  import MediaEmbedSwitcher from "../content/MediaEmbedSwitcher.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;

    repostable: boolean;
  }
  let { note, metadata, displayMenu, depth, repostable }: Props = $props();
  let deleted = $state(false);
  let website = $derived(reactionWebsite(note));

  function reactionWebsite(note: Nostr.Event): string | undefined {
    // "i" タグを優先して探す
    const iTag = note.tags.find((tag) => tag[0] === "i");
    if (iTag && iTag.length > 2) {
      return iTag[2]; // URLは3番目
    }

    // 従来の r タグやURLタグがあれば fallback
    const rTag = note.tags.find((tag) => tag[0] === "r");
    if (rTag && rTag.length > 1) {
      return rTag[1];
    }

    return undefined;
  }
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else if note}
  <RepostComponent>
    {#snippet kindIcon()}
      <div class="w-fit min-w-[20px] max-w-[40%]">
        <Reaction event={note} />
      </div>
    {/snippet}
    {#snippet userIcon()}
      <UserPopupMenu
        pubkey={note.pubkey}
        {metadata}
        size={20}
        {displayMenu}
        {depth}
      />
    {/snippet}
    {#snippet name()}
      <ProfileDisplay pubkey={note.pubkey} {metadata} />
    {/snippet}

    {#snippet actionButtons()}
      {#if displayMenu}
        <NoteActionButtons {note} {repostable} bind:deleted />{/if}
    {/snippet}
  </RepostComponent>
  <!--リアクションしたノートの情報（リポストのを使いまわし）-->

  {#if website}
    <div class="p-2">
      {#if lumiSetting.get().showImg && isvalidURL(website)}
        <MediaEmbedSwitcher url={website || ""} author={note.pubkey} />
      {:else}
        <Link className="underline text-magnum-300 break-all " href={website}
          >{website}</Link
        >{/if}
    </div>
  {/if}
{/if}
