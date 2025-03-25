<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import { formatAbsoluteDate } from "$lib/func/util";

  import Link from "$lib/components/Elements/Link.svelte";
  import { nip19 } from "nostr-tools";
  import { getRelaysById } from "$lib/func/nostr";
  import { SquareArrowOutUpRight } from "lucide-svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";

  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import Content from "../../content/Content.svelte";

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
  }: Props = $props();

  let deleted = $state(false);
  let polltype: string | undefined = $derived(
    note.tags.find((tag) => tag[0] === "polltype" && tag.length > 1)?.[1]
  );
  let endsAt: number | undefined = $derived(
    Number(note.tags.find((tag) => tag[0] === "endsAt" && tag.length > 1)?.[1])
  );

  let nevent: string | undefined = $derived.by(() => {
    if (!note) {
      return undefined;
    }
    try {
      const eventpointer: nip19.EventPointer = {
        id: note.id,
        relays: tieKey ? getRelaysById(note.id, tieKey) : [],
        author: note.pubkey,
        kind: note.kind,
      };
      return nip19.neventEncode(eventpointer);
    } catch {
      return undefined;
    }
  });
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

    {#snippet content()}
      <div class="flex flex-col p-0.5 mt-1">
        <Content
          {zIndex}
          {maxHeight}
          text={note.content}
          tags={note.tags}
          {displayMenu}
          {depth}
          {repostable}
          {tieKey}
        />
        {#each note.tags.filter((tag) => tag[0] === "option" && tag.length > 2) as itemTag}
          <label>
            <input type="radio" disabled={true} /><span class="ml-2 break-all"
              >{itemTag[2]}</span
            ></label
          >
        {/each}
      </div>
      <div class="mt-2">
        {#if Math.floor(Date.now() / 1000) > endsAt}
          <p class="text-neutral-500 font-sm">Voting period has ended</p>
        {:else}
          <p class="text-neutral-500 font-sm">
            Ends at: {formatAbsoluteDate(endsAt)}
          </p>
        {/if}

        <p class="text-neutral-500 font-sm">Type: {polltype}</p>

        <Link
          className="underline text-magnum-300 break-all hover:opacity-80 flex items-center gap-1"
          href={`https://nos-haiku.vercel.app/entry/${nevent}`}
          >go to poll<SquareArrowOutUpRight size={12} /></Link
        >
      </div>
    {/snippet}
    {#snippet actionButtons()}
      {#if displayMenu}
        <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
    {/snippet}
  </NoteComponent>
{/if}
