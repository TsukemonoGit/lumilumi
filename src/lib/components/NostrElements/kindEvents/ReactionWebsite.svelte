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
  const { note, metadata, displayMenu, depth, repostable }: Props = $props();
  let deleted = $state(false);
  const website = $derived(reactionWebsite(note));
  function reactionWebsite(note: Nostr.Event): string | undefined {
    const webTag = note.tags.find((tag) => tag[0] === "r");
    if (webTag && webTag.length > 1) {
      return webTag[1];
    } else {
      return undefined;
    }
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
