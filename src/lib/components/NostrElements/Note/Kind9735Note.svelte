<script lang="ts">
  import ProxyTag from "$lib/components/Elements/ProxyTag.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import { profile } from "$lib/func/util";
  import { Repeat2, Zap } from "lucide-svelte";
  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import RepostedNote from "./RepostedNote.svelte";
  import ZapReactionList from "../AllReactionsElement/ZapReactionList.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { decode } from "light-bolt11-decoder";
  export let note: Nostr.Event;

  const kind9734 = (event: Nostr.Event): Nostr.Event | undefined => {
    try {
      return JSON.parse(
        event.tags.find((tag) => tag[0] === "description")?.[1] ?? ""
      );
    } catch (error) {
      return undefined;
    }
  };

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

  const amount = Math.floor(
    Number(
      decode(
        note.tags.find((tag) => tag[0] === "bolt11")?.[1] ?? ""
      )?.sections.find((item) => item.name === "amount")?.value
    ) / 1000
  );
</script>

{#await kind9734(note) then zapRequestEvent}
  {#if zapRequestEvent !== undefined}
    <Metadata
      queryKey={["metadata", zapRequestEvent.pubkey]}
      pubkey={zapRequestEvent.pubkey}
      let:metadata
    >
      <div class="flex gap-1">
        <Zap
          class="min-w-[20px] mt-auto mb-auto  stroke-orange-400 fill-orange-400"
          size={20}
        />{amount}

        <div class="self-center">
          <UserMenu pubkey={zapRequestEvent.pubkey} {metadata} size={20} />
        </div>
        <div
          class=" mt-auto inline-block break-all break-words whitespace-pre-line"
        >
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
          <RepostedNote {tag} kind={undefined} />
        {/if}
      {/await}
    </Metadata>
  {/if}
{/await}
