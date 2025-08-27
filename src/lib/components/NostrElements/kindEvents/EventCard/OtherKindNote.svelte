<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import Content from "../../content/Content.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";

  import NoteComponent from "../layout/NoteComponent.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import { checkContentWarning } from "$lib/func/event";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: number | undefined;
    repostable: boolean;

    zIndex: number | undefined;
    mini: boolean;
    showStatus?: boolean;
  }

  const {
    note,
    metadata,
    displayMenu,
    depth,
    maxHeight,
    repostable,

    zIndex,
    mini,
    showStatus = true,
  }: Props = $props();

  let deleted = $state(false);
  const title = $derived(
    note.tags.find((tag) => tag[0] === "title" && tag.length > 1)?.[1]
  );
  const dtag = $derived(
    note.tags.find((tag) => tag[0] === "d" && tag.length > 1)?.[1]
  );
  const description = $derived(
    note.tags.find(
      (tag) =>
        (tag[0] === "description" || tag[0] === "summary") && tag.length > 1
    )?.[1]
  );
  const image = $derived(
    note.tags.find((tag) => tag[0] === "image" && tag.length > 1)?.[1]
  );

  const warning = $derived(checkContentWarning(note?.tags));
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else}
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

    {#snippet content()}
      {#if title || dtag || description}
        <div class="rounded-md bg-neutral-800 p-2">
          {#if (title && title !== "") || dtag}
            <div class="text-lg font-bold">
              {title && title !== "" ? title : dtag}
            </div>{/if}
          <div
            class="grid grid-rows-[1fr_auto] xs:grid-cols-[1fr_auto] w-full gap-1 whitespace-pre-wrap"
          >
            {#if description && description !== ""}<div
                class="px-1 text-neutral-300/80 max-h-32 xs:max-h-40 overflow-y-auto"
              >
                {description}
              </div>{/if}

            {#if image && lumiSetting.get().showImg}
              <img
                loading="lazy"
                src={image}
                alt=""
                class="object-contain overflow-hidden max-w-32 max-h-32 xs:max-w-40 xs:max-h-40 mx-auto"
              />{/if}
          </div>
        </div>{/if}

      {#if note.content.includes("?iv=")}
        <!--なんか暗号化したやつっぽいから表示しないでおく-->
        <!-- <Content
    text={note.content}
    tags={note.tags}
    {displayMenu}
    {depth}
    {repostable}
    
  /> -->
      {:else}
        <Content
          {maxHeight}
          event={note}
          {displayMenu}
          {depth}
          {repostable}
          {zIndex}
        />
      {/if}
    {/snippet}
    {#snippet actionButtons()}
      {#if displayMenu}
        <NoteActionButtons {note} {repostable} bind:deleted />{/if}
    {/snippet}
  </NoteComponent>
{/if}
