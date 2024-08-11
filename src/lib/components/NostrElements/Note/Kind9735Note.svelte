<script lang="ts">
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import { profile } from "$lib/func/util";
  import { Zap } from "lucide-svelte";
  import { nip19, verifyEvent } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import RepostedNote from "./RepostedNote.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { decode } from "light-bolt11-decoder";
  import { muteCheck } from "$lib/func/muteCheck";
  import { loginUser, queryClient } from "$lib/stores/stores";
  import type { EventPacket } from "rx-nostr";
  import { getZapLNURLPubkey } from "$lib/func/makeZap";

  export let note: Nostr.Event;
  export let depth: number;
  export let excludefunc = (event: Nostr.Event) => false;

  let viewMuteEvent: boolean;
  //kind9734の取得と検証
  const zapRequestEvent = extractKind9734(note);

  const zappedId: {
    kind: number | undefined;
    tag: string[];
  } = extractZappedId(note.tags);

  const amount: number | undefined = extractAmount(note);

  const muteType = !zapRequestEvent
    ? "null"
    : excludefunc(zapRequestEvent)
      ? "null"
      : muteCheck(zapRequestEvent);

  function extractKind9734(event: Nostr.Event): Nostr.Event | undefined {
    //description tag を持たなければならない
    const descriptionTag = event.tags.find((tag) => tag[0] === "description");
    if (!descriptionTag || descriptionTag.length <= 1) {
      return;
    }
    try {
      const kind9734 = JSON.parse(descriptionTag[1]);
      //kind9734の検証
      if (verifyEvent(kind9734)) {
        return kind9734;
      }
    } catch (error) {
      console.error("Error parsing description tag:", error);
      return;
    }
  }

  function extractZappedId(tags: Nostr.Tag.Any[]): {
    kind: number | undefined;
    tag: string[];
  } {
    const eTag = tags?.find((tag) => tag[0] === "e");
    return {
      kind: undefined,
      tag: eTag ? (eTag as string[]) : [],
    };
  }
  //https://scrapbox.io/nostr/NIP-57
  function extractAmount(note: Nostr.Event): number | undefined {
    //bolt11 tag を持たなければならない
    const bolt11Tag = note.tags.find((tag) => tag[0] === "bolt11");
    if (!bolt11Tag || bolt11Tag.length <= 1) {
      return;
    }
    try {
      const decoded = decode(bolt11Tag[1]);
      if (decoded) {
        const amountSection = decoded.sections.find(
          (section) => section.name === "amount"
        )?.value;

        const requestAmount = zapRequestEvent?.tags.find(
          (tag) => tag[0] === "amount"
        )?.[1];

        //`zapレシート`の`bolt11`タグに含まれる`invoiceAmount`は（存在する場合には）`zapリクエスト`の`amount`タグと等しくなければならない
        if (amountSection !== requestAmount) {
          return undefined;
        }
        if (amountSection) {
          return Math.floor(Number(amountSection) / 1000);
        }
      }
    } catch (error) {
      console.error("Error decoding bolt11 tag:", error);
      return;
    }
  }

  async function check9735(note: Nostr.Event): Promise<boolean | undefined> {
    //受け取る側のウォレットのpubkeyを取得する
    const metadata = (
      $queryClient?.getQueryData(["metadata", $loginUser]) as EventPacket
    ).event;
    if (!metadata) {
      return;
    }
    const zapPubkey = await getZapLNURLPubkey(metadata);
    return zapPubkey === note.pubkey;
  }
</script>

{#if zapRequestEvent !== undefined && amount !== undefined}
  {#await check9735(note) then isValidEvent9735}
    {#if isValidEvent9735 === true || isValidEvent9735 === undefined}
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
              />
            </div>
            <div class="inline-block break-all break-words whitespace-pre-line">
              {#if metadata}
                {profile(metadata)?.display_name ?? profile(metadata)?.name}
                <span class="text-magnum-100 text-sm"
                  >@{profile(metadata)?.name}</span
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

          {#if zappedId.tag.length > 0}
            <RepostedNote tag={zappedId.tag} {depth} />
          {/if}
        </Metadata>
      {/if}
    {/if}
  {/await}
{/if}
