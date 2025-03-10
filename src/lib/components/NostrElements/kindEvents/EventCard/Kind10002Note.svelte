<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";

  import NoteComponent from "../layout/NoteComponent.svelte";

  import ShowStatus from "../Status/ShowStatus.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import DisplayTime from "./DisplayTime.svelte";

  interface Props {
    note: Nostr.Event;
    metadata?: Nostr.Event | undefined;
    zIndex?: number;
    maxHeight?: number;

    repostable: boolean;

    mini?: boolean;

    depth: number;

    displayMenu?: boolean;
    tieKey: string | undefined;
    kindInfo?: boolean;

    deleted: boolean;
  }

  let {
    note,
    metadata = $bindable(undefined),
    mini = false,
    depth,
    displayMenu = true,
    tieKey,
    kindInfo = false,

    repostable,

    deleted = $bindable(),
  }: Props = $props();
</script>

<NoteComponent>
  {#snippet icon()}
    <UserPopupMenu
      pubkey={note.pubkey}
      {metadata}
      size={mini ? 20 : 40}
      {displayMenu}
      {depth}
      {tieKey}
    />
  {/snippet}
  {#snippet seenOn()}
    {#if lumiSetting.get().showRelayIcon && displayMenu}
      <SeenonIcons id={note.id} width={mini ? 20 : 40} {tieKey} />{/if}
  {/snippet}
  {#snippet name()}
    <ProfileDisplay {note} {metadata} {kindInfo} />
  {/snippet}
  {#snippet time()}
    <DisplayTime {displayMenu} {note} {tieKey} />
  {/snippet}
  {#snippet status()}
    {#if lumiSetting.get().showUserStatus}<ShowStatus
        pubkey={note.pubkey}
        {tieKey}
      />{/if}
  {/snippet}

  {#snippet content()}
    <span class="italic text-neutral-500">kind: 10002 Relays</span>
  {/snippet}
  {#snippet actionButtons()}
    {#if displayMenu}
      <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
  {/snippet}
</NoteComponent>
