<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import { parseNaddr } from "$lib/func/util";

  import { nip19 } from "nostr-tools";

  import NoteComponent from "../layout/NoteComponent.svelte";

  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import Content from "../../content/Content.svelte";

  import { _ } from "svelte-i18n";
  import ReplyTo from "../layout/ReplyTo.svelte";
  import UserName from "../../user/UserName.svelte";
  import PopupUserName from "../../user/PopupUserName.svelte";
  import ClientTag from "../../content/ClientTag.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;

    tieKey: string | undefined;
    mini: boolean;
    warning: string[] | undefined;
    zIndex: number | undefined;
    maxHeight: number | undefined;
    repostable: boolean;
    showStatus?: boolean;
    replyUsers: string[];
  }

  let {
    note,
    metadata,
    displayMenu,
    depth,

    tieKey,
    mini,
    warning,
    zIndex,
    maxHeight,
    repostable,
    showStatus = true,
    replyUsers,
  }: Props = $props();

  let deleted = $state(false);
  let referenceTag = $derived(
    note.tags.find((tag) => tag[0] === "r" || tag[0] === "a" || tag[0] === "e")
  ); //https://github.com/nostr-protocol/nips/blob/master/84.md#references

  // 引用元へのリンクパスを取得する関数
  function getReferencePath(tag: string[]): string {
    if (tag[0] === "e") {
      try {
        return `/${nip19.noteEncode(tag[1])}`;
      } catch (e) {
        return "";
      }
    } else if (tag[0] === "a") {
      try {
        return `/${nip19.naddrEncode(parseNaddr(tag))}`;
      } catch (error) {
        return "";
      }
    } else {
      return tag[1];
    }
  }
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else if note}
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
      <ProfileDisplay
        pubkey={note.pubkey}
        {metadata}
        kindInfo={note.kind !== 1 ? true : false}
      />
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

    {#snippet content()}
      <div class="flex flex-col p-0.5 mt-1">
        <blockquote>
          <Content
            {zIndex}
            {maxHeight}
            text={note.content}
            tags={note.tags}
            {displayMenu}
            {depth}
            {repostable}
            {tieKey}
            displayTags={false}
          />

          {#if referenceTag}
            <div class="reference-citation">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={getReferencePath(referenceTag)}
                class="reference-link"
              >
                <span class="reference-icon">—</span><span
                  class="reference-text">{getReferencePath(referenceTag)}</span
                >
              </a>
            </div>
          {/if}
        </blockquote>
      </div>
      <ClientTag tags={note.tags} {depth} />
    {/snippet}
    {#snippet actionButtons()}
      {#if displayMenu}
        <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
    {/snippet}
  </NoteComponent>
{/if}

<style>
  blockquote {
    padding: 0.5em 1.5em;

    border-left: 5px solid rgb(var(--color-magnum-500) / 1); /* 引用の左側にカラーテーマに基づくライン */
    background-color: rgb(
      var(--color-neutral-800) / 1
    ); /* 背景色をカラーテーマに基づく */
    color: rgb(
      var(--color-neutral-50) / 1
    ); /* テキスト色をカラーテーマに基づく */
    font-style: italic;
    quotes: "" " " "" "'" "'";
    line-height: 1.5;
  }

  .reference-citation {
    font-style: normal;
    margin-top: 0.75em;
    padding-top: 0.5em;
    border-top: 1px solid rgba(var(--color-neutral-600) / 0.5);
    text-align: right;
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .reference-link {
    color: rgb(var(--color-neutral-300) / 1);
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .reference-link:hover {
    color: rgb(var(--color-magnum-300) / 1);
    opacity: 1;
  }

  .reference-icon {
    font-size: 1.2em;
    margin-right: 0.2em;
  }

  .reference-text {
    font-weight: 500;
    font-style: italic;
  }
</style>
