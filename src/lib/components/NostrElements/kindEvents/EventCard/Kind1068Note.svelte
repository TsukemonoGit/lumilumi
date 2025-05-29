<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import { formatAbsoluteDate } from "$lib/func/util";

  import { nip19 } from "nostr-tools";
  import { getRelaysById } from "$lib/func/nostr";

  import NoteComponent from "../layout/NoteComponent.svelte";

  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import Content from "../../content/Content.svelte";
  import { page } from "$app/state";

  import PollSingleBuilder from "./poll/PollSingleBuilder.svelte";
  import PollMultiBuilder from "./poll/PollMultiBuilder.svelte";
  import { goto } from "$app/navigation";
  import { t as _ } from "@konemono/svelte5-i18n";

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
  let hasEnded = $derived(Math.floor(Date.now() / 1000) > endsAt);

  const handleclickGotoPoll = () => {
    goto(`./${nevent}`);
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
        <div>
          <Content
            {zIndex}
            {maxHeight}
            text={note.content}
            tags={note.tags}
            {displayMenu}
            {depth}
            {repostable}
            {tieKey}
            kind={note.kind}
          />
        </div>
        {#if page.params.note || page.params.naddr}
          {#if polltype === "multiplechoice"}
            <PollMultiBuilder {note} {hasEnded} />
          {:else}
            <PollSingleBuilder {note} {hasEnded} />
          {/if}
          <!--NOTEとかページの投稿は展開する-->
          <!--投票もできるようにする-->
        {:else}
          {#each note.tags.filter((tag) => tag[0] === "option" && tag.length > 2) as itemTag}
            <label class="flex flex-wrap">
              <input type="radio" disabled={true} /><span class="ml-2 break-all"
                ><Content
                  text={itemTag[2]}
                  tags={note.tags}
                  displayTags={false}
                  displayMenu={false}
                  {depth}
                  {tieKey}
                  repostable={false}
                /></span
              ></label
            >
          {/each}
        {/if}
      </div>
      <div class="mt-2">
        {#if hasEnded}
          <p class="text-neutral-500 font-sm">Voting period has ended</p>
        {:else}
          <p class="text-neutral-500 font-sm">
            Ends at: {formatAbsoluteDate(endsAt)}
          </p>
        {/if}

        <p class="text-neutral-500 font-sm">Type: {polltype}</p>
        {#if !(page.params.note || page.params.naddr)}
          <button
            type="button"
            onclick={handleclickGotoPoll}
            class=" border border-neutral-400 text-magnum-300 break-all hover:opacity-80 flex items-center gap-1 rounded-md px-2 mt-2"
          >
            {hasEnded
              ? `${$_("poll.view_results")}`
              : `${$_("poll.goto_poll")}`}</button
          >
          <!--   <Link
            className="underline text-magnum-300 break-all hover:opacity-80 flex items-center gap-1"
            href={`https://nos-haiku.vercel.app/entry/${nevent}`}
            >go to poll<SquareArrowOutUpRight size={12} /></Link
          > -->{/if}
      </div>
    {/snippet}
    {#snippet actionButtons()}
      {#if displayMenu}
        <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
    {/snippet}
  </NoteComponent>
{/if}
