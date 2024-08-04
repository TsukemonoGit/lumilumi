<script lang="ts">
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import { profile } from "$lib/func/util";
  import { Zap } from "lucide-svelte";
  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import RepostedNote from "./RepostedNote.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { decode } from "light-bolt11-decoder";
  import { muteCheck } from "$lib/func/muteCheck";

  export let note: Nostr.Event;
  export let depth: number;
  export let excludefunc = (event: Nostr.Event) => false;

  let viewMuteEvent: boolean;
  $: zapRequestEvent = kind9734(note);

  $: muteType = !zapRequestEvent
    ? "null"
    : excludefunc(zapRequestEvent)
      ? "null"
      : muteCheck(zapRequestEvent);

  const kind9734 = (event: Nostr.Event): Nostr.Event | undefined => {
    const desc = event.tags.find((tag) => tag[0] === "description");
    if (!desc || desc.length <= 1) {
      return;
    }
    try {
      return JSON.parse(desc[1]);
    } catch (error) {
      return;
    }
  };
  // //IDのイベント購読にリクエストのIDを含める//なんやかんやでZAPへのリアクションはなし
  // $: if (zapRequestEvent && zapRequestEvent.id !== currentNoteId) {
  //   $viewEventIds = $viewEventIds.filter((item) => item !== currentNoteId);
  //   if (!$viewEventIds.includes(zapRequestEvent.id)) {
  //     $viewEventIds.push(zapRequestEvent.id);
  //   }
  //   currentNoteId = zapRequestEvent.id;
  // }

  // onDestroy(() => {
  //   if (zapRequestEvent) {
  //     $viewEventIds = $viewEventIds.filter(
  //       (item: string) => item !== zapRequestEvent.id
  //     );
  //   }
  // });
  function zapedId(tags: Nostr.Tag.Any[]): {
    kind: number | undefined;
    tag: string[];
  } {
    const etag = tags?.find((tag) => tag[0] === "e");
    return {
      kind: undefined,
      tag: etag ? (etag as string[]) : ([] as string[]),
    };
  }
  let amount: number | undefined;
  $: if (note) {
    amount = getAmount(note);
  }
  const getAmount = (note: Nostr.Event): number | undefined => {
    const bolt11 = note.tags.find((tag) => tag[0] === "bolt11");
    if (!bolt11 || bolt11.length <= 1) {
      return;
    }
    try {
      const decoded = decode(bolt11[1]);

      if (decoded) {
        const num = decoded.sections.find(
          (item) => item.name === "amount"
        )?.value;

        if (num) {
          return Math.floor(Number(num) / 1000);
        }
      }
    } catch (error) {
      console.log(error);
      return;
    }
  };
</script>

{#if zapRequestEvent !== undefined && amount !== undefined}
  {#if muteType !== "null" && depth >= 1}
    <button
      class="rounded bg-magnum-700 hover:opacity-75 active:opacity-50 text-magnum-50"
      on:click={() => (viewMuteEvent = !viewMuteEvent)}
    >
      {viewMuteEvent ? "hide" : "view"} Mute:{muteType}
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
          class="min-w-[20px] mt-auto mb-auto  stroke-orange-400 fill-orange-400"
          size={20}
        />{amount}

        <div class="self-center">
          <UserMenu
            pubkey={zapRequestEvent.pubkey}
            {metadata}
            size={20}
            {depth}
          />
        </div>
        <div class="inline-block break-all break-words whitespace-pre-line">
          {#if metadata}
            {profile(metadata)?.display_name ?? profile(metadata)?.name}<span
              class="text-magnum-100 text-sm">@{profile(metadata)?.name}</span
            >
          {:else}
            <span class="text-magnum-100 text-sm"
              >@{nip19.npubEncode(zapRequestEvent.pubkey)}</span
            >
          {/if}
        </div>

        <div class="ml-auto mr-2">
          <NoteActionButtons note={zapRequestEvent} />
        </div>
      </div>
      <div class="break-all text-sm px-2">{zapRequestEvent.content}</div>
      {#await zapedId(note.tags) then { kind, tag }}
        {#if tag}
          <RepostedNote {tag} kind={undefined} {depth} />
        {/if}
      {/await}
    </Metadata>
  {/if}
{/if}
