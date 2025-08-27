<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import { formatAbsoluteDateFromUnix } from "$lib/func/util";

  import * as nip19 from "nostr-tools/nip19";
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

    mini: boolean;
    warning: string[] | undefined;
    zIndex: number | undefined;
    maxHeight: number | undefined;
    repostable: boolean;
    showStatus?: boolean;
  }

  const {
    note,
    metadata,
    displayMenu,
    depth,

    mini,
    warning,
    zIndex,
    maxHeight,
    repostable,
    showStatus = true,
  }: Props = $props();

  let deleted = $state(false);
  const polltype: string | undefined = $derived(
    note.tags.find((tag) => tag[0] === "polltype" && tag.length > 1)?.[1]
  );
  const endsAt: number | undefined = $derived(
    Number(note.tags.find((tag) => tag[0] === "endsAt" && tag.length > 1)?.[1])
  );

  const nevent: string | undefined = $derived.by(() => {
    if (!note) {
      return undefined;
    }
    try {
      const eventpointer: nip19.EventPointer = {
        id: note.id,
        relays: getRelaysById(note.id),
        author: note.pubkey,
        kind: note.kind,
      };
      return nip19.neventEncode(eventpointer);
    } catch {
      return undefined;
    }
  });
  const hasEnded = $derived(Math.floor(Date.now() / 1000) > endsAt);

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
        kindInfo={note.kind !== 1 ? true : false}
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
      <div class="flex flex-col p-0.5 mt-1">
        <div>
          <Content
            {zIndex}
            {maxHeight}
            event={note}
            {displayMenu}
            {depth}
            {repostable}
          />
        </div>
        {#if page.route.id === "/[note=note]" || page.route.id === "/[naddr=naddr]"}<!--channel/[note=note]ではなんないように-->
          {#if polltype === "multiplechoice"}
            <PollMultiBuilder {note} {hasEnded} {endsAt} />
          {:else}
            <PollSingleBuilder {note} {hasEnded} {endsAt} />
          {/if}
          <!--NOTEとかページの投稿は展開する-->
          <!--投票もできるようにする-->
        {:else}
          {#each note.tags.filter((tag) => tag[0] === "option" && tag.length > 2) as itemTag}
            <label class="inline-flex">
              <input type="radio" disabled={true} /><span class="ml-2 break-all"
                ><Content
                  event={{
                    ...note,
                    content: itemTag[2],
                  }}
                  displayTags={false}
                  displayMenu={false}
                  {depth}
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
            Ends at: {formatAbsoluteDateFromUnix(endsAt)}
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
        <NoteActionButtons {note} {repostable} bind:deleted />{/if}
    {/snippet}
  </NoteComponent>
{/if}
