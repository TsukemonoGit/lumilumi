<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";

  import { checkContentWarning } from "$lib/func/event";

  import NoteComponent from "../layout/NoteComponent.svelte";
  import Content from "../../content/Content.svelte";
  import UserName from "../../user/UserName.svelte";
  import PopupUserName from "../../user/PopupUserName.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import Reply from "../Reply.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ReplyTo from "../layout/ReplyTo.svelte";

  interface Props {
    note: Nostr.Event;
    metadata?: Nostr.Event | undefined;
    zIndex?: number;
    maxHeight?: number;
    replyTag: string[] | undefined;
    thread: boolean;
    repostable: boolean;

    mini?: boolean;

    depth: number;

    displayMenu?: boolean;

    kindInfo?: boolean;
    replyUsers: string[];
    deleted: boolean;
    showStatus?: boolean;
  }

  let {
    note,
    metadata = $bindable(undefined),
    mini = false,
    depth,
    displayMenu = true,

    kindInfo = false,
    zIndex,
    maxHeight,
    repostable,
    replyUsers,
    deleted = $bindable(),
    replyTag,
    thread,
    showStatus,
  }: Props = $props();

  let warning = $derived(checkContentWarning(note?.tags));
</script>

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
    />
  {/snippet}
  {#snippet seenOn()}
    {#if lumiSetting.get().showRelayIcon && displayMenu}
      <SeenonIcons id={note.id} width={mini ? 20 : 40} />{/if}
  {/snippet}
  {#snippet name()}
    <ProfileDisplay
      pubkey={note.pubkey}
      kind={note.kind}
      {metadata}
      {kindInfo}
    />
  {/snippet}
  {#snippet time()}
    <DisplayTime {displayMenu} {note} />
  {/snippet}
  {#snippet status()}
    {#if lumiSetting.get().showUserStatus && showStatus}<ShowStatus
        pubkey={note.pubkey}
      />{/if}
  {/snippet}
  {#snippet replyUser()}
    {#if replyUsers.length > 0}
      <ReplyTo
        >{#each replyUsers as user}
          {#if !displayMenu}<UserName pubhex={user} />{:else}
            <PopupUserName pubkey={user} {zIndex} />{/if}
        {/each}</ReplyTo
      >{/if}
  {/snippet}
  {#snippet reply()}
    {#if !thread && (replyTag || replyUsers.length > 0)}
      <Reply {replyTag} {displayMenu} depth={depth + 1} {repostable} {zIndex} />
    {/if}
  {/snippet}
  {#snippet content()}
    <Content
      {zIndex}
      {maxHeight}
      event={note}
      {displayMenu}
      {depth}
      {repostable}
    />
  {/snippet}
  {#snippet actionButtons()}
    {#if displayMenu}
      <NoteActionButtons {note} {repostable} bind:deleted />{/if}
  {/snippet}
</NoteComponent>
