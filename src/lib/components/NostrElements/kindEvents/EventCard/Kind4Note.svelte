<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { _ } from "svelte-i18n";
  import { loginUser } from "$lib/stores/stores";

  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";

  import Content from "../../content/Content.svelte";
  import UserName from "../../user/UserName.svelte";
  import Reply from "../Reply.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import ReplyTo from "../layout/ReplyTo.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: number | undefined;
    tieKey: string | undefined;
    mini: boolean;
    warning: string[] | undefined;
    replyUsers: string[];
    thread: boolean;
    replyTag: string[] | undefined;
    repostable: boolean;
    deleted: boolean;
    zIndex?: number;
    showStatus?: boolean;
  }

  let {
    note,
    metadata,
    displayMenu,
    depth,
    maxHeight,
    tieKey,
    mini,
    warning,
    replyUsers,
    thread,
    replyTag,
    repostable,
    deleted = $bindable(),
    zIndex,
    showStatus = true,
  }: Props = $props();

  let decrypt: string | undefined = $state(undefined);

  //自分宛て？もしくは自分が書いた？
  let forme = $derived(
    note.pubkey === $loginUser ||
      note.tags.find(
        (tag) => tag[0] === "p" && tag.length > 1 && tag[1] === $loginUser
      )
  );

  //どっちがどっち
  async function decryptMessage() {
    const user = note.tags.find(
      (tag) => tag[0] === "p" && tag.length > 1 && tag[1] !== $loginUser
    )?.[1];
    try {
      decrypt = await (window?.nostr as Nostr.Nip07.Nostr)?.nip04?.decrypt(
        user ?? note.pubkey,
        note.content
      );

      if (!decrypt) {
        decrypt = "decrypt error";
      }
    } catch (error) {
      decrypt = "decrypt error";
    }
  }
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
    <ProfileDisplay pubkey={note.pubkey} {metadata} />
  {/snippet}
  {#snippet time()}
    <DisplayTime {displayMenu} {note} {tieKey} />
  {/snippet}
  {#snippet status()}
    {#if lumiSetting.get().showUserStatus && showStatus}<ShowStatus
        pubkey={note.pubkey}
        {tieKey}
      />{/if}
  {/snippet}
  {#snippet replyUser()}
    {#if replyUsers.length > 0}
      <ReplyTo
        >{#each replyUsers as user}
          {#if !displayMenu}<UserName pubhex={user} />{:else}
            <PopupUserName pubkey={user} {tieKey} {zIndex} />{/if}
        {/each}</ReplyTo
      >{/if}
  {/snippet}
  {#snippet reply()}
    {#if !thread && (replyTag || replyUsers.length > 0)}
      <Reply {replyTag} {displayMenu} depth={depth + 1} {repostable} {tieKey} />
    {/if}
  {/snippet}
  {#snippet content()}
    <div class="text-sm text-neutral-400">{$_("event.kind4.text")}</div>
    {#if forme}
      {#if !decrypt}
        <button
          class="rounded bg-magnum-700 hover:opacity-75 active:opacity-50 text-magnum-50"
          onclick={decryptMessage}>{$_("event.kind4.decrypt")}</button
        >{:else}
        <!--複合できたら内容を表示-->
        <Content
          {maxHeight}
          text={decrypt}
          tags={note.tags}
          {displayMenu}
          {depth}
          repostable={false}
          {tieKey}
        />
      {/if}
    {/if}
  {/snippet}
  {#snippet actionButtons()}
    {#if displayMenu}
      <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
  {/snippet}
</NoteComponent>
