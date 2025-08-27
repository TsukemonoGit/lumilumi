<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";
  import Content from "../../content/Content.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import UserName from "../../user/UserName.svelte";
  import Reply from "../Reply.svelte";
  import { checkContentWarning } from "$lib/func/event";
  import ChannelTag from "../../content/ChannelTag.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";

  import DisplayTime from "./DisplayTime.svelte";
  import ReplyTo from "../layout/ReplyTo.svelte";

  interface Props {
    thread: boolean;
    displayMenu: boolean;
    note: Nostr.Event;
    depth: number;
    repostable: boolean;

    zIndex?: number;
    mini?: boolean;
    metadata: Nostr.Event | undefined;
    replyTag: string[] | undefined;
    replyUsers: string[];
    showStatus?: boolean;
  }

  const {
    thread,
    displayMenu,
    note,
    depth,
    repostable,

    zIndex = 0,
    mini,
    metadata,
    replyTag,
    replyUsers,
    showStatus = true,
  }: Props = $props();

  let deleted = $state(false);
  const heyaId = note.tags.find(
    (tag) => tag[0] === "e" && tag[3] === "root"
  )?.[1];

  const warning = $derived(checkContentWarning(note.tags));
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
    <ProfileDisplay pubkey={note.pubkey} {metadata} />
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
      event={note}
      {displayMenu}
      {depth}
      {repostable}
    /><ChannelTag {heyaId} />
  {/snippet}
  {#snippet actionButtons()}
    {#if displayMenu}
      <NoteActionButtons {note} {repostable} bind:deleted />{/if}
  {/snippet}
</NoteComponent>
