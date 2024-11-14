<script lang="ts">
  import { Repeat, Reply, Zap } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import Reaction from "../NostrElements/Note/Reaction.svelte";
  import { extractZappedId, replyedEvent, repostedId } from "$lib/func/event";
  import ReactionToastContent from "../NostrElements/Note/ReactionToastContent.svelte";
  import UserName from "../NostrElements/Note/UserName.svelte";
  import { extractKind9734, extractAmount } from "$lib/func/zap";
  import Content from "../NostrElements/Note/Content.svelte";
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
        const { replyTag, replyUsers } = replyedEvent(event.tags);
        return replyTag;
    }
  };
</script>

{#if handledTag}
  {#if event.kind === 6 || event.kind === 16}
    <div class="flex w-full">
      <Repeat class="text-magnum-400" /><UserName pubhex={event.pubkey} />
    </div>
    <div class="px-2 w-full"><ReactionToastContent tag={handledTag} /></div>
  {:else if event.kind === 7}
    <div class="flex w-full">
      <Reaction {event} /><UserName pubhex={event.pubkey} />
    </div>
    <div class="px-2 w-full"><ReactionToastContent tag={handledTag} /></div>
  {:else if event.kind === 9735}
    {@const zapRequest = extractKind9734(event)}
    {@const zapAmount = extractAmount(event, zapRequest)}
    <div class="flex w-full">
      <Zap class="text-magnum-400" />{zapAmount}{#if zapRequest}<UserName
          pubhex={zapRequest.pubkey}
        />{zapRequest.content}{/if}
    </div>
    <div class="px-2 w-full"><ReactionToastContent tag={handledTag} /></div>
  {:else}
    <div class="flex w-full">
      <Reply class="text-magnum-400" /><ReactionToastContent tag={handledTag} />
    </div>
    <UserName pubhex={event.pubkey} />
    <div class="px-2 w-full">
      <Content
        text={event.content.length < 40
          ? (event.content ?? "")
          : `${event.content.slice(0, 40)}...`}
        tags={event.tags}
        displayMenu={false}
        depth={0}
        repostable={false}
        tieKey={undefined}
      />
    </div>
  {/if}
{/if}
