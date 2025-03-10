<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";
  import Content from "../../content/Content.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import UserName from "../../user/UserName.svelte";
  import Reply from "../Reply.svelte";
  import { checkContentWarning, replyedEvent } from "$lib/func/event";
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
    tieKey: string | undefined;
    zIndex?: number;
    mini?: boolean;
    metadata: Nostr.Event | undefined;
  }

  let {
    thread,
    displayMenu,
    note,
    depth,
    repostable,
    tieKey,
    zIndex = 0,
    mini,
    metadata,
  }: Props = $props();

  let deleted = $state(false);
  const heyaId = note.tags.find(
    (tag) => tag[0] === "e" && tag[3] === "root"
  )?.[1];

  let res = $derived(replyedEvent(note.tags, note.kind));
  let replyTag = $derived(
    res.replyTag && res.replyTag.length > 3 && res.replyTag[3] === "root"
      ? undefined
      : res.replyTag
  ); //rootは部屋ID
  let replyUsers = $derived(res.replyUsers);

  let warning = $derived(checkContentWarning(note.tags));
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
  {#snippet replyUser()}
    {#if replyUsers.length > 0}
      <ReplyTo
        >{#each replyUsers as user}
          {#if !displayMenu}<UserName pubhex={user} />{:else}
            <PopupUserName pubkey={user} {tieKey} />{/if}
        {/each}</ReplyTo
      >{/if}
  {/snippet}
  {#snippet reply()}
    {#if !thread && (replyTag || replyUsers.length > 0)}
      <Reply {replyTag} {displayMenu} depth={depth + 1} {repostable} {tieKey} />
    {/if}
  {/snippet}

  {#snippet content()}
    <Content
      {zIndex}
      text={note.content}
      tags={note.tags}
      {displayMenu}
      {depth}
      {repostable}
      {tieKey}
    /><ChannelTag {heyaId} {tieKey} />
  {/snippet}
  {#snippet actionButtons()}
    {#if displayMenu}
      <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
  {/snippet}
</NoteComponent>
