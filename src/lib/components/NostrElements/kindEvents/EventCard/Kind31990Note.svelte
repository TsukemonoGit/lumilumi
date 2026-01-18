<script lang="ts">
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";

  import { type Ogp } from "$lib/func/ogp";
  import * as Nostr from "nostr-typedef";

  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";

  interface Props {
    note: Nostr.Event;
    data: {
      ogp: Ogp;
      url: string;
    };
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;

    showStatus?: boolean;
  }

  let {
    note,
    data,
    metadata,
    displayMenu,
    depth,
    repostable,

    showStatus,
  }: Props = $props();

  let deleted = $state(false);
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else}
  <NoteComponent warningText={undefined}>
    {#snippet icon()}
      <UserPopupMenu
        pubkey={note?.pubkey || ""}
        {metadata}
        size={20}
        {displayMenu}
        {depth}
      />
    {/snippet}
    {#snippet seenOn()}
      {#if lumiSetting.get().showRelayIcon && displayMenu}
        <SeenonIcons id={note.id} width={20} />{/if}
    {/snippet}
    {#snippet name()}
      <ProfileDisplay
        pubkey={note?.pubkey || ""}
        kind={note.kind}
        {metadata}
        kindInfo={true}
      />
    {/snippet}
    {#snippet time()}
      <DisplayTime {displayMenu} {note} />
    {/snippet}
    {#snippet status()}
      {#if lumiSetting.get().showUserStatus && showStatus}<ShowStatus
          pubkey={note?.pubkey || ""}
        />{/if}
    {/snippet}

    {#snippet content()}
      <OgpCard contents={data.ogp} url={data.url} />
    {/snippet}
    {#snippet actionButtons()}
      {#if displayMenu}
        <NoteActionButtons {note} {repostable} bind:deleted />{/if}
    {/snippet}
  </NoteComponent>
{/if}
