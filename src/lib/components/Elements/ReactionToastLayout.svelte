<script lang="ts">
  import { Mail, Repeat, Reply, TriangleAlert, Zap } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import Reaction from "../NostrElements/kindEvents/Reaction.svelte";
  import ReactionToastContent from "../NostrElements/kindEvents/ReactionToastContent.svelte";
  import UserName from "../NostrElements/user/UserName.svelte";

  import {
    checkContentWarning,
    extractZappedId,
    replyedEvent,
    repostedId,
    shortText,
  } from "$lib/func/event";
  import { extractKind9734, extractAmount } from "$lib/func/zap";
  import ReactionToastWarningText from "./ReactionToastWarningText.svelte";

  interface Props {
    event: Nostr.Event;
  }

  let { event }: Props = $props();

  type KindType = "repost" | "reaction" | "zap" | "reply" | "mention" | "dm";

  const kindType = (event: Nostr.Event): KindType => {
    if (event.kind === 4) return "dm";
    if (event.kind === 6 || event.kind === 16 || event.kind === 1111)
      return "repost";
    if (event.kind === 7) return "reaction";
    if (event.kind === 9735) return "zap";
    return "reply";
  };

  const handledTag = (event: Nostr.Event): string[] | undefined => {
    switch (kindType(event)) {
      case "repost":
      case "reaction":
        return repostedId(event.tags)?.tag;
      case "zap":
        return extractZappedId(event.tags)?.tag;
      case "reply": {
        const { replyTag } = replyedEvent(event.tags, event.kind);
        return replyTag;
      }
      default:
        return undefined;
    }
  };

  const kType = $derived(kindType(event));
  const tag = $derived(handledTag(event));

  const warning = $derived(checkContentWarning(event.tags));
</script>

{#if kType === "dm"}
  <div class="flex w-full">
    <Mail class="text-magnum-400 min-w-4" />
    <UserName pubhex={event.pubkey} />
  </div>
{:else if tag}
  {#if kType === "repost"}
    <div class="flex w-full">
      <Repeat class="text-magnum-400 min-w-4" />
      <UserName pubhex={event.pubkey} />
    </div>
    <div class="px-2 w-full">
      <ReactionToastContent {tag} />
    </div>
  {:else if kType === "reaction"}
    <div class="flex w-full">
      <Reaction {event} />
      <UserName pubhex={event.pubkey} />
    </div>
    <div class="px-2 w-full">
      <ReactionToastContent {tag} />
    </div>
  {:else if kType === "zap"}
    {@const zapRequest = extractKind9734(event)}
    {@const zapAmount = extractAmount(event, zapRequest)}
    <div class="flex w-full">
      <Zap class="text-magnum-400 min-w-4" />
      {zapAmount}
      {#if zapRequest}
        <UserName pubhex={zapRequest.pubkey} />
        {#if checkContentWarning(zapRequest.tags)}
          <span class="italic text-neutral-500">WARNING CONTENT</span>
        {:else}
          {zapRequest.content}
        {/if}
      {/if}
    </div>
    <div class="px-2 w-full">
      <ReactionToastContent {tag} />
    </div>
  {:else}
    <div class="flex w-full">
      <Reply class="text-magnum-400 min-w-4" />
      <ReactionToastContent {tag} />
    </div>
    <UserName pubhex={event.pubkey} />
    {#if warning}
      <ReactionToastWarningText />
    {:else}
      {shortText(event.content)}
    {/if}
  {/if}
{:else}
  <!-- mention (no handled tag) -->
  <Reply class="text-magnum-400 min-w-4" />
  {#if warning}
    <ReactionToastWarningText />
  {:else}
    {shortText(event.content)}
  {/if}
{/if}
