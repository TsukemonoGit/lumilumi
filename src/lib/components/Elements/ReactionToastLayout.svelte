<script lang="ts">
  import { Repeat, Reply, Zap } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import Reaction from "../NostrElements/Note/Reaction.svelte";
  import {
    extractAmount,
    extractZappedId,
    replyedEvent,
    repostedId,
  } from "$lib/func/event";
  import ReactionToastContent from "../NostrElements/Note/ReactionToastContent.svelte";
  import UserName from "../NostrElements/Note/UserName.svelte";
  import { extractKind9734 } from "$lib/func/makeZap";
  export let event: Nostr.Event;

  $: handledTag = getHandledTag(event);

  const getHandledTag = (event: Nostr.Event): string[] | undefined => {
    switch (event.kind) {
      case 6:
      case 16:
      case 7:
        return repostedId(event.tags)?.tag;
        break;
      case 9735:
        return extractZappedId(event.tags)?.tag;
        break;
      default:
        const { replyID, replyUsers } = replyedEvent(event.tags);
        return replyID ? ["e", replyID] : undefined;
    }
  };
</script>

{#if handledTag}
  <div class="flex items-center gap-1">
    {#if event.kind === 6 || event.kind === 16}
      <Repeat class="text-magnum-400" /><UserName pubhex={event.pubkey} />
    {:else if event.kind === 7}
      <Reaction {event} /><UserName pubhex={event.pubkey} />
    {:else if event.kind === 9735}
      {@const zapRequest = extractKind9734(event)}
      {@const zapAmount = extractAmount(event, zapRequest)}
      <Zap class="text-magnum-400" />{zapAmount}{#if zapRequest}<UserName
          pubhex={zapRequest.pubkey}
        />{zapRequest.content}{/if}
    {:else}
      <Reply class="text-magnum-400" /><UserName pubhex={event.pubkey} />
    {/if}
  </div>
  <div class="px-2 w-full"><ReactionToastContent tag={handledTag} /></div>
{/if}
