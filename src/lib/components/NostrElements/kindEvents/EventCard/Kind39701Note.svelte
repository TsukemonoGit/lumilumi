<!--バッジ受賞-->
<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { t as _ } from "@konemono/svelte5-i18n";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";

  import { datetime, formatAbsoluteDateFromUnix } from "$lib/func/util";
  // import ClientTag from "../../content/ClientTag.svelte";
  import MediaEmbedSwitcher from "../../content/MediaEmbedSwitcher.svelte";
  import Content from "../../content/Content.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: number | undefined;

    mini: boolean;
    warning: string[] | undefined;

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

    mini,
    warning,

    repostable,
    deleted = $bindable(),
    zIndex,
    showStatus = true,
  }: Props = $props();
  const siteUrl = $derived.by(() => {
    const urlTag = note.tags.find(
      (tag) => tag[0] == "d" && tag.length > 1
    )?.[1];
    if (!urlTag) return;
    if (!urlTag?.startsWith("http")) {
      return `https://${urlTag}`;
    } else {
      return urlTag;
    }
  });
  const title = $derived(
    note.tags.find((tag) => tag[0] == "title" && tag.length > 1)?.[1]
  );
  const published_at = $derived(
    note.tags.find((tag) => tag[0] == "published_at" && tag.length > 1)?.[1]
  );
  const hashTags = $derived(
    note.tags
      .filter((tag) => tag[0] == "t" && tag.length > 1)
      .map((tag) => tag[1])
  );
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
      {metadata}
      kindInfo={true}
      kind={note.kind}
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

  {#snippet content()}
    <div>
      <div class="text-lg font-bold">{title}</div>
      <MediaEmbedSwitcher url={siteUrl || ""} author={note.pubkey} />
      <div class="mt-2">
        <Content
          {zIndex}
          {maxHeight}
          event={note}
          {displayMenu}
          {depth}
          {repostable}
        />
      </div>
      <div class="mt-2">
        {#each hashTags as hash}
          <a
            aria-label="Search for events containing the hashtag"
            href={`/search?t=${hash}`}
            class="underline text-magnum-300 break-all mr-1">#{hash}</a
          >
        {/each}
      </div>
      <!--  <ClientTag tags={note.tags} {depth} /> -->
      {#if !isNaN(Number(published_at))}
        <time class="float-end" datetime={datetime(Number(published_at))}
          >at {formatAbsoluteDateFromUnix(Number(published_at))}</time
        >{/if}
    </div>
  {/snippet}
  {#snippet actionButtons()}
    {#if displayMenu}
      <NoteActionButtons {note} {repostable} bind:deleted />{/if}
  {/snippet}
</NoteComponent>
