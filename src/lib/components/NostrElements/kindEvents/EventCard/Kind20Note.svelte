<!--https://github.com/nostr-protocol/nips/blob/master/68.md-->
<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import Content from "../../content/Content.svelte";

  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";

  import { reverseConvertMetaTags, type Imeta } from "$lib/func/imeta";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import ContentImage from "../../content/ContentImage.svelte";
  import { viewMediaModal } from "$lib/stores/stores";

  import ShowStatus from "../Status/ShowStatus.svelte";
  import UserName from "../../user/UserName.svelte";
  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ReplyTo from "../layout/ReplyTo.svelte";

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
  let imeta: Imeta[] | undefined = $derived(
    note?.tags
      .filter((tag: string[]) => tag[0] === "imeta" && tag.length > 1)
      ?.map((imeta) => reverseConvertMetaTags(imeta))
      .filter((tag) => tag !== undefined)
  );
  //console.log(imeta);
  let imageList = $derived(
    imeta.map((i) => i.url).filter((tag) => tag !== undefined)
  );

  const openModal = (index: number) => {
    // modalIndex = index;
    // if (showModal) $showModal = true;
    // console.log(imageList, index);
    $viewMediaModal = { index: index, mediaList: imageList };
  };
  let title = $derived(note.tags.find((tag) => tag[0] === "title")?.[1]);
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

    {#snippet content()}
      {#if title && title !== ""}
        <div class="text-lg font-bold">
          {title}
        </div>{/if}
      {#if imageList.length > 0}
        {#each imageList as url, number}
          <ContentImage
            src={url}
            {url}
            {number}
            {openModal}
            author={note.pubkey}
          />
        {/each}{/if}
      <Content
        {maxHeight}
        event={note}
        {displayMenu}
        {depth}
        {repostable}
        {zIndex}
      />
      <span
        class={"float-end text-neutral-400    text-sm font-semibold px-1"}
        title="kind:20"
      >
        Picture</span
      >
    {/snippet}
    {#snippet actionButtons()}
      {#if displayMenu}
        <NoteActionButtons {note} {repostable} bind:deleted />{/if}
    {/snippet}
  </NoteComponent>
{/if}
