<script lang="ts">
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import * as Nostr from "nostr-typedef";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import { checkContentWarning } from "$lib/func/event";

  interface Props {
    note: Nostr.Event;
    depth: number;
    repostable: boolean;

    displayMenu: boolean;
    tieKey: string | undefined;
    mini: any;
    message?: string | undefined; // console.log(message);
  }

  let {
    note,
    depth,
    repostable,

    displayMenu,
    tieKey,
    mini,
    message = undefined,
  }: Props = $props();

  let deleted = $state(false);
  let warning = $derived(checkContentWarning(note?.tags));
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else if note}
  <Metadata queryKey={["metadata", note.pubkey]} pubkey={note.pubkey}>
    {#snippet loading()}
      <NoteComponent
        warningText={warning !== undefined
          ? warning.length > 1
            ? warning[1]
            : ""
          : undefined}
      >
        {#snippet icon()}
          <UserPopupMenu
            pubkey={note.pubkey}
            metadata={undefined}
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
          <ProfileDisplay {note} metadata={undefined} />
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
          <span class="text-magnum-200 italic"
            >{message ?? `Invalid kind:${note.kind} Event`}</span
          >
        {/snippet}
        {#snippet actionButtons()}
          {#if displayMenu}
            <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
        {/snippet}
      </NoteComponent>
    {/snippet}
    {#snippet nodata()}
      <NoteComponent
        warningText={warning !== undefined
          ? warning.length > 1
            ? warning[1]
            : ""
          : undefined}
      >
        {#snippet icon()}
          <UserPopupMenu
            pubkey={note.pubkey}
            metadata={undefined}
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
          <ProfileDisplay {note} metadata={undefined} />
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
          <span class="text-magnum-200 italic"
            >{message ?? `Invalid kind:${note.kind} Event`}</span
          >
        {/snippet}
        {#snippet actionButtons()}
          {#if displayMenu}
            <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
        {/snippet}
      </NoteComponent>
    {/snippet}
    {#snippet error()}
      <NoteComponent
        warningText={warning !== undefined
          ? warning.length > 1
            ? warning[1]
            : ""
          : undefined}
      >
        {#snippet icon()}
          <UserPopupMenu
            pubkey={note.pubkey}
            metadata={undefined}
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
          <ProfileDisplay {note} metadata={undefined} />
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
          <span class="text-magnum-200 italic"
            >{message ?? `Invalid kind:${note.kind} Event`}</span
          >
        {/snippet}
        {#snippet actionButtons()}
          {#if displayMenu}
            <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
        {/snippet}
      </NoteComponent>
    {/snippet}

    {#snippet content({ metadata })}
      <NoteComponent
        warningText={warning !== undefined
          ? warning.length > 1
            ? warning[1]
            : ""
          : undefined}
      >
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
          <ProfileDisplay {note} {metadata} />
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
          <span class="text-magnum-200 italic whitespace-pre-wrap break-words"
            >{message ?? `Invalid kind:${note.kind} Event`}</span
          >
        {/snippet}
        {#snippet actionButtons()}
          {#if displayMenu}
            <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
        {/snippet}
      </NoteComponent>
    {/snippet}
  </Metadata>
{/if}
