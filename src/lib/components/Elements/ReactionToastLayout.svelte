<script lang="ts">
  import { Repeat, Reply, Zap } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import Reaction from "../NostrElements/Note/Reaction.svelte";
  import { extractZappedId, replyedEvent, repostedId } from "$lib/func/event";
  import ReactionToastContent from "../NostrElements/Note/ReactionToastContent.svelte";
  import UserName from "../NostrElements/Note/UserName.svelte";
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
  <div class="flex grid-cols-[auto_1fr] items-center">
    {#if event.kind === 6 || event.kind === 16}
      <Repeat class="text-magnum-400" />
    {:else if event.kind === 7}
      <Reaction {event} />
    {:else if event.kind === 9735}
      <Zap class="text-magnum-400" />
    {:else}
      <Reply class="text-magnum-400" />
    {/if}<UserName pubhex={event.pubkey} />
  </div>
  <div class="px-2 w-full"><ReactionToastContent tag={handledTag} /></div>
{/if}
