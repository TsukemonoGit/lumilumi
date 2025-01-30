<!--https://github.com/nostr-protocol/nips/blob/master/68.md-->
<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { nip19 } from "nostr-tools";
  import { getRelaysById } from "$lib/func/nostr";

  import Content from "../../content/Content.svelte";

  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";

  import { reverseConvertMetaTags, type Imeta } from "$lib/func/imeta";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import ContentImage from "../../content/ContentImage.svelte";
  import { viewMediaModal } from "$lib/stores/stores";
  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";
  import NoteTemplate from "../NoteTemplate.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import UserName from "../../user/UserName.svelte";
  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";

  interface Props {
    replyUsers: string[];
    mini: boolean;
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: number | undefined;
    repostable: boolean;
    tieKey: string | undefined;
    warning: string[] | undefined;
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
    tieKey,
    warning,
  }: Props = $props();

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

<NoteTemplate {note} {metadata} {mini} {displayMenu} {depth} {tieKey}>
  {#if lumiSetting.get().showUserStatus}<ShowStatus
      pubkey={note.pubkey}
      {tieKey}
    />{/if}
  <!-- {@const { replyID, replyUsers } = replyedEvent(note.tags)}-->
  {#if replyUsers.length > 0}
    <div
      class="my-1 text-sm text-magnum-300 flex break-all flex-wrap overflow-x-hidden gap-x-1 max-h-12 overflow-y-auto"
    >
      <span class="text-sm text-neutral-50">To:</span>{#each replyUsers as user}
        {#if !displayMenu}<UserName pubhex={user} />{:else}
          <PopupUserName pubkey={user} {tieKey} />{/if}
      {/each}
    </div>
  {/if}

  <div class="relative overflow-hidden mb-1.5">
    {#if title && title !== ""}
      <div class="text-lg font-bold">
        {title}
      </div>{/if}
    {#if imageList.length > 0}
      {#each imageList as url, number}
        <ContentImage src={url} {url} {number} {openModal} />
      {/each}{/if}
    <Content
      {maxHeight}
      text={note.content}
      tags={note.tags}
      {displayMenu}
      {depth}
      {repostable}
      {tieKey}
    />
    <span
      class={"float-end text-neutral-400    text-sm font-semibold px-1"}
      title="kind:20"
    >
      Picture</span
    >
    {#if warning}
      <!-- <WarningHide1 text={tag[1]} /> -->

      <WarningHide2 text={warning[1]} />
    {/if}
  </div>
  {#if displayMenu}
    <NoteActionButtons {note} {repostable} {tieKey} />
  {/if}
</NoteTemplate>
