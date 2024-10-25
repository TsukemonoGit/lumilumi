<script lang="ts">
  import UserMenu from "$lib/components/Elements/UserPopupMenu.svelte";
  import { profile } from "$lib/func/util";
  import { Zap } from "lucide-svelte";
  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";

  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { muteCheck } from "$lib/func/muteCheck";
  import { mutebykinds, mutes } from "$lib/stores/stores";

  import { extractKind9734, getZapLNURLPubkey } from "$lib/func/makeZap";
  import { extractAmount, extractZappedId } from "$lib/func/event";

  import Kind9735Invalid from "./Kind9735Invalid.svelte";
  import RepostedNote from "./RepostedNote.svelte";
  import DisplayName from "$lib/components/Elements/DisplayName.svelte";

  export let note: Nostr.Event;
  export let depth: number;
  export let excludefunc = (event: Nostr.Event) => false;
  export let repostable: boolean;
  export let maxHeight: string;
  export let displayMenu: boolean;
  export let tieKey: string | undefined;
  export let mini;
  let viewMuteEvent: boolean;
  //kind9734の取得と検証
  const zapRequestEvent = extractKind9734(note);

  const zappedId: {
    kind: number | undefined;
    tag: string[];
  } = extractZappedId(note.tags);

  const amount: number | undefined = extractAmount(note, zapRequestEvent);

  //muteの値が変わったら更新する
  const muteType = !zapRequestEvent
    ? "null"
    : excludefunc(zapRequestEvent)
      ? "null"
      : $mutes || $mutebykinds
        ? muteCheck(zapRequestEvent)
        : "null";
</script>

{#if !zapRequestEvent || !amount}<Kind9735Invalid
    {note}
    {repostable}
    {displayMenu}
    {depth}
    {maxHeight}
    {tieKey}
    {mini}
  />{:else}
  {@const receivepub = zapRequestEvent?.tags.find((tag) => tag[0] === "p")?.[1]}
  {#if !receivepub}<Kind9735Invalid
      {note}
      {repostable}
      {displayMenu}
      {depth}
      {maxHeight}
      {tieKey}
      {mini}
    />
  {:else}
    <Metadata
      queryKey={["metadata", receivepub]}
      pubkey={receivepub}
      let:metadata={receiverMetadata}
    >
      <div slot="loading">
        <Kind9735Invalid
          {note}
          {repostable}
          {displayMenu}
          {depth}
          {maxHeight}
          {tieKey}
          {mini}
          message={"loading zap recipient's data..."}
        />
      </div>
      <div slot="nodata">
        <Kind9735Invalid
          {note}
          {repostable}
          {displayMenu}
          {depth}
          {maxHeight}
          {tieKey}
          {mini}
          message={"failed to get zap recipient's data."}
        />
      </div>
      <div slot="error">
        <Kind9735Invalid
          {note}
          {repostable}
          {displayMenu}
          {depth}
          {maxHeight}
          {tieKey}
          {mini}
          message={"error to get zap recipient's data."}
        />
      </div>
      {#await getZapLNURLPubkey(receiverMetadata) then isValidEvent9735}
        {#if !isValidEvent9735}<Kind9735Invalid
            {note}
            {repostable}
            {displayMenu}
            {depth}
            {maxHeight}
            {tieKey}
            {mini}
          />
        {:else}
          {#if muteType !== "null" && depth >= 1}
            <button
              class="rounded bg-magnum-700 hover:opacity-75 active:opacity-50 text-magnum-50"
              on:click={() => (viewMuteEvent = !viewMuteEvent)}
            >
              {viewMuteEvent ? "hide" : "view"} Mute: {muteType}
            </button>
          {/if}

          {#if muteType === "null" || viewMuteEvent}
            <Metadata
              queryKey={["metadata", zapRequestEvent.pubkey]}
              pubkey={zapRequestEvent.pubkey}
              let:metadata
            >
              <div class="flex gap-1 items-center align-middle">
                <Zap
                  class="min-w-[20px] mt-auto mb-auto stroke-orange-400 fill-orange-400"
                  size={20}
                />
                {amount}

                <div class="self-center">
                  <UserMenu
                    pubkey={zapRequestEvent.pubkey}
                    {metadata}
                    size={20}
                    {depth}
                    {tieKey}
                  />
                </div>
                <div
                  class="inline-block break-all break-words whitespace-pre-line"
                >
                  {#if metadata}
                    {@const prof = profile(metadata)}
                    {#if prof}
                      <DisplayName
                        height={21}
                        name={prof.display_name ?? prof.name ?? ""}
                        tags={metadata.tags}
                      />
                    {/if}
                    <span class="text-magnum-100 text-sm"
                      >@{#if prof}
                        <DisplayName
                          height={21}
                          name={prof.name ?? prof.display_name ?? ""}
                          tags={metadata.tags}
                        />
                      {/if}</span
                    >
                  {:else}
                    <span class="text-magnum-100 text-sm"
                      >@{nip19.npubEncode(zapRequestEvent.pubkey)}</span
                    >
                  {/if}
                </div>
                <UserMenu
                  pubkey={note.pubkey}
                  metadata={undefined}
                  size={20}
                  {depth}
                  {tieKey}
                />
                <div class="ml-auto mr-2">
                  <NoteActionButtons {note} {repostable} {tieKey} />
                </div>
              </div>
              <div class="break-all text-sm px-2">
                {zapRequestEvent.content}
              </div>

              {#if zappedId.tag.length > 0}
                <RepostedNote
                  tag={zappedId.tag}
                  {depth}
                  {repostable}
                  {maxHeight}
                  {displayMenu}
                  {tieKey}
                />
              {/if}
            </Metadata>
          {/if}{/if}
      {/await}
    </Metadata>{/if}{/if}
