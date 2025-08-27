<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { extractZappedId } from "$lib/func/event";
  import { mutebykinds, mutes } from "$lib/stores/stores";
  import { muteCheck } from "$lib/func/muteCheck";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { X, Zap } from "lucide-svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import { profile } from "$lib/func/util";
  import DisplayName from "../../user/DisplayName.svelte";
  import { encodetoNpub } from "$lib/func/encode";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import RepostedNote from "./RepostedNote.svelte";
  import Popover from "$lib/components/Elements/Popover.svelte";

  interface Props {
    note: Nostr.Event;
    depth: number;
    excludefunc?:  (event: Nostr.Event) => boolean;
    repostable: boolean;
    maxHeight: number | undefined;
    displayMenu: boolean;

    mini: boolean;
    zapRequestEvent: Nostr.Event;
    amount: number;
    message?: string | undefined;
    zIndex?: number;
  }

  const {
    note,
    depth,
    excludefunc = (event: Nostr.Event) => false,
    repostable,
    maxHeight,
    displayMenu,

    mini,
    zapRequestEvent,
    amount,
    message,
    zIndex,
  }: Props = $props();
  let deleted = $state(false);
  let viewMuteEvent: boolean = $state(false);

  const zappedId: {
    tag: string[];
  } = extractZappedId(zapRequestEvent?.tags || []);

  const muteType = !zapRequestEvent
    ? "null"
    : excludefunc(zapRequestEvent)
      ? "null"
      : $mutes || $mutebykinds
        ? muteCheck(zapRequestEvent)
        : "null";
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else}
  {#if muteType !== "null" && depth >= 1}
    <button
      class="rounded bg-magnum-700 hover:opacity-75 active:opacity-50 text-magnum-50"
      onclick={() => (viewMuteEvent = !viewMuteEvent)}
    >
      {viewMuteEvent ? "hide" : "view"} Mute: {muteType}
    </button>
  {/if}

  {#if muteType === "null" || viewMuteEvent}
    <Metadata
      queryKey={["metadata", zapRequestEvent.pubkey]}
      pubkey={zapRequestEvent.pubkey}
    >
      {#snippet content({ metadata })}
        <div class="flex gap-1 items-center align-middle">
          {#if message}
            <Popover ariaLabel="zap status">
              <div
                class="relative text-magnum-400 text-sm drop-shadow-md flex min-w-[20px] mt-auto mb-auto"
              >
                <Zap class="stroke-magnum-600" size={20} />
                <X
                  class="absolute right-0  bottom-0 stroke-magnum-300"
                  size={10}
                />
              </div>
              {#snippet popoverContent()}
                <div class="mr-8">
                  {message}
                </div>
              {/snippet}</Popover
            >
          {:else}
            <Zap
              class="min-w-[20px] mt-auto mb-auto stroke-magnum-400 fill-magnum-400"
              size={20}
            />{/if}
          {amount}

          <div class="self-center">
            <UserPopupMenu
              pubkey={zapRequestEvent.pubkey}
              {metadata}
              size={20}
              {depth}
            />
          </div>

          {#if metadata}
            {@const prof = profile(metadata)}
            {#if prof}
              <DisplayName
                height={21}
                name={prof.display_name ?? ""}
                tags={metadata.tags}
              />{#if prof && prof.name && prof.name !== ""}<span
                  class="text-magnum-100 text-sm"
                  ><DisplayName
                    height={21}
                    name={`@${prof.name}`}
                    tags={metadata.tags}
                  />
                </span>{/if}{/if}
          {:else}
            <span class="text-magnum-100 text-sm"
              >@{encodetoNpub(zapRequestEvent.pubkey)}</span
            >
          {/if}

          <UserPopupMenu
            pubkey={note.pubkey}
            metadata={undefined}
            size={20}
            {depth}
          />
          <div class="ml-auto">
            <NoteActionButtons {note} {repostable} bind:deleted />
          </div>
        </div>
        <div class="break-all text-sm px-2">
          {zapRequestEvent.content}
        </div>

        {#if zappedId.tag.length > 0}
          <RepostedNote
            tag={zappedId.tag}
            depth={depth + 1}
            {repostable}
            {displayMenu}
            {maxHeight}
            {zIndex}
            {mini}
          />
        {/if}
      {/snippet}
    </Metadata>
  {/if}
{/if}
