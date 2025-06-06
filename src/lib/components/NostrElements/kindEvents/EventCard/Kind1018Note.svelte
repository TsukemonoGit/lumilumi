<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import Content from "../../content/Content.svelte";

  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  import ShowStatus from "../Status/ShowStatus.svelte";
  import UserName from "../../user/UserName.svelte";
  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ReplyTo from "../layout/ReplyTo.svelte";
  import { hexRegex } from "$lib/func/regex";
  import { Quote } from "lucide-svelte";
  import Note from "../Note.svelte";

  interface Props {
    replyUsers: string[];
    mini: boolean;
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: number | undefined;
    repostable: boolean;

    warning: string[] | undefined;
    zIndex?: number;
    showStatus?: boolean;
  }

  let {
    replyUsers,
    mini,
    note,
    metadata,
    displayMenu,
    depth,
    maxHeight,
    repostable,

    warning,
    zIndex,
    showStatus = true,
  }: Props = $props();
  let deleted = $state(false);

  let pollEventId: string | undefined = $derived.by(() => {
    const id = note?.tags.find((tag) => tag[0] === "e")?.[1];
    if (id && hexRegex.test(id)) {
      return id;
    }
  });

  let response: string[] | undefined = $derived(
    note.tags
      .filter((tag: string[]) => tag[0] === "response")
      .map((tag) => tag[1])
  );

  let selectedOptionTags: string[][] | undefined = $state(undefined);

  const handleNoteChange = (ev: Nostr.Event) => {
    console.log(response);
    if (response) {
      selectedOptionTags = ev.tags.filter(
        (tag) =>
          tag[0] === "option" && tag.length > 2 && response.includes(tag[1])
      );
    }
    console.log(selectedOptionTags);
  };
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
      />
    {/snippet}
    {#snippet seenOn()}
      {#if lumiSetting.get().showRelayIcon && displayMenu}
        <SeenonIcons id={note.id} width={mini ? 20 : 40} />{/if}
    {/snippet}
    {#snippet name()}
      <ProfileDisplay
        pubkey={note.pubkey}
        {metadata}
        kind={note.kind}
        kindInfo={true}
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

    {#snippet content()}
      <div class="voted-message">
        {#if selectedOptionTags}
          {#each selectedOptionTags as tag}
            <div
              class="whitespace-pre-wrap break-words"
              style="word-break: break-word;"
            >
              ✅: {tag[2]}
            </div>
          {/each}
        {/if}
      </div>
      {#if pollEventId}
        <div class="grid grid-cols-[auto_1fr_auto]">
          <Quote size="14" class="text-magnum-500 fill-magnum-500/75 " />
          <div class="border rounded-md border-magnum-600/30">
            <Note
              onChange={handleNoteChange}
              id={pollEventId}
              mini={true}
              {displayMenu}
              {depth}
              {repostable}
              {maxHeight}
              {zIndex}
            />
          </div>
          <Quote size="14" class="text-magnum-500 fill-magnum-500/75 " />
        </div>
      {/if}
      <Content
        {maxHeight}
        text={note.content}
        tags={note.tags}
        {displayMenu}
        {depth}
        {repostable}
        {zIndex}
        kind={note.kind}
      />
    {/snippet}
    {#snippet actionButtons()}
      {#if displayMenu}
        <NoteActionButtons {note} {repostable} bind:deleted />{/if}
    {/snippet}
  </NoteComponent>
{/if}
