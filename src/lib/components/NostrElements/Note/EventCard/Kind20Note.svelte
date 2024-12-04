<!--https://github.com/nostr-protocol/nips/blob/master/68.md-->
<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import UserMenu from "$lib/components/Elements/UserPopupMenu.svelte";
  import { datetime, formatAbsoluteDate, profile } from "$lib/func/util";

  import { nip19 } from "nostr-tools";
  import { getRelaysById } from "$lib/func/nostr";
  import { goto } from "$app/navigation";

  import Content from "../Content.svelte";

  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import DisplayName from "$lib/components/Elements/DisplayName.svelte";
  import { reverseConvertMetaTags, type Imeta } from "$lib/func/imeta";
  import { followList } from "$lib/stores/globalRunes.svelte";
  import ContentImage from "../content/ContentImage.svelte";
  import { viewMediaModal } from "$lib/stores/stores";
  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: string;
    repostable: boolean;
    tieKey: string | undefined;
    warning: string[] | undefined;
  }

  let {
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
  //console.log(imageList);
  let eventpointer: nip19.EventPointer = {
    id: note.id,
    relays: tieKey ? getRelaysById(note.id, tieKey) : [],
    author: note.pubkey,
    kind: note.kind,
  };

  let nevent = nip19.neventEncode(eventpointer);

  const handleClickToNotepage = () => {
    //Goto Note page

    goto(`/${nevent}`);
  };

  let prof = $derived(profile(metadata));
  let petname = $derived(followList.get.get(note.pubkey));
  const openModal = (index: number) => {
    // modalIndex = index;
    // if (showModal) $showModal = true;
    //   console.log("viewmedia");
    $viewMediaModal = { index: index, mediaList: imageList };
  };
  let title = $derived(note.tags.find((tag) => tag[0] === "title")?.[1]);
</script>

<div
  class="break-words overflow-x-hidden gap-4 p-1"
  style="word-break: break-word;"
>
  <div class="w-full flex gap-1">
    {#if metadata}
      <div>
        <UserMenu
          pubkey={note.pubkey}
          {metadata}
          size={20}
          {displayMenu}
          {depth}
          {tieKey}
        />
      </div>
      <div class="text-magnum-100 text-sm">
        {#if petname}<span class="text-magnum-100">📛{petname}</span>
        {:else if metadata && prof}
          <DisplayName
            height={21}
            name={prof.display_name ?? ""}
            tags={metadata.tags}
          />
          {#if prof.name && prof.name !== ""}<span
              class="inline text-magnum-100 text-sm"
              ><DisplayName
                height={21}
                name={`@${prof.name}`}
                tags={metadata.tags}
              /></span
            >{/if}
        {:else}
          <span class="text-magnum-100 text-sm break-all">
            @{nip19.npubEncode(note.pubkey)}</span
          >
        {/if}
      </div>
    {:else}
      <span class="text-magnum-100 text-sm break-all">
        @{nip19.npubEncode(note.pubkey)}</span
      >
    {/if}
    {#if displayMenu}
      <button
        onclick={handleClickToNotepage}
        class="  ml-auto mr-1 min-w-7 text-magnum-100 text-xs hover:underline"
      >
        <time datetime={datetime(note.created_at)}
          >{formatAbsoluteDate(note.created_at)}</time
        >
      </button>
    {/if}
  </div>
  <div class="relative overflow-hidden mb-1.5">
    <div
      class="mt-0.5 overflow-y-auto overflow-x-hidden"
      style="max-height:{maxHeight ?? 'none'}"
    >
      {#if title && title !== ""}
        <div class="text-lg font-bold">
          {title}
        </div>{/if}
      {#if imageList.length > 0}
        {#each imageList as url, number}
          <ContentImage src={url} {url} {number} {openModal} />
        {/each}{/if}
      <Content
        text={note.content}
        tags={note.tags}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
      />
      {#if warning}
        <!-- <WarningHide1 text={tag[1]} /> -->

        <WarningHide2 text={warning[1]} />
      {/if}
    </div>
  </div>
  {#if displayMenu}
    <NoteActionButtons {note} {repostable} {tieKey} />
  {/if}
</div>
