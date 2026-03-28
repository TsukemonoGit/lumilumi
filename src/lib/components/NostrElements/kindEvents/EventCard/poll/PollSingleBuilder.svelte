<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { RadioGroup } from "melt/builders";
  import { promisePublishSignedEvent, usePromiseReq } from "$lib/func/nostr";
  import { pipe } from "rxjs";
  import { nip07Signer, uniq } from "rx-nostr";
  import { untrack } from "svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { latestEachPubkey } from "$lib/stores/operators";
  import UserPopupMenu from "$lib/components/NostrElements/user/UserPopupMenu.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { clientTag } from "$lib/func/constants";
  import Content from "$lib/components/NostrElements/content/Content.svelte";
  import { RefreshCw } from "lucide-svelte";
  import { addToast } from "$lib/components/Elements/Toast.svelte";

  let {
    note,
    hasEnded,
    endsAt,
  }: { note: Nostr.Event; hasEnded: boolean; endsAt: number | undefined } =
    $props();

  const depth = 0;

  let group: RadioGroup | undefined = $state();
  let userVoteEvent: Nostr.Event | undefined = $state();
  let voteEvents: Nostr.Event[] = $state([]);
  let voteRelays: string[] = $state([]);
  let isSubmitting: boolean = $state(false);
  let isLoading: boolean = $state(false);

  let optionTags: string[][] = $derived(
    note?.tags?.filter((tag) => tag[0] === "option" && tag.length > 2) || [],
  );

  function reset(): void {
    userVoteEvent = undefined;
    voteEvents = [];
    voteRelays = [];
    isSubmitting = false;
  }

  function extractVoteRelays(noteEvent: Nostr.Event): string[] {
    return noteEvent.tags.reduce((relays: string[], tag) => {
      if (tag[0] === "relay" && tag.length > 1) {
        return Array.from(new Set([...relays, tag[1]]));
      }
      return relays;
    }, []);
  }

  function createVoteFilter(noteId: string, endTime?: number): Nostr.Filter {
    const filter: Nostr.Filter = { kinds: [1018], "#e": [noteId] };
    if (endTime) {
      filter.until = endTime;
    }
    return filter;
  }

  function getUserVoteValue(voteEvent: Nostr.Event | undefined): string {
    if (!voteEvent) return "";

    const responseTag = voteEvent.tags.find(
      (tag) => tag[0] === "response" && tag.length > 1,
    );
    if (!responseTag) return "";

    const matchingOption = optionTags.find(
      (option) => option[1] === responseTag[1],
    );
    return matchingOption ? matchingOption[1] : "";
  }
  async function fetchVoteEvents(): Promise<void> {
    isLoading = true;

    try {
      voteRelays = extractVoteRelays(note);

      const filter = createVoteFilter(note.id, endsAt);
      const targetRelays = voteRelays.length > 0 ? voteRelays : undefined;

      const events = await usePromiseReq(
        {
          filters: [filter],
          operator: pipe(uniq(), latestEachPubkey()),
        },
        targetRelays,
      );

      voteEvents = events?.map((ev) => ev.event) || [];
      userVoteEvent = voteEvents.find(
        (ev) => ev.pubkey === lumiSetting.get().pubkey,
      );

      if (group) {
        group.value = getUserVoteValue(userVoteEvent);
      }
    } finally {
      isLoading = false;
    }
  }

  async function submitVote(): Promise<void> {
    if (!group?.value || !lumiSetting.get().pubkey || isSubmitting) return;

    try {
      isSubmitting = true;

      const voteEventParams: Nostr.EventParameters = {
        kind: 1018,
        tags: [
          ["e", note.id],
          ["response", group.value],
        ],
        content: "",
      };

      if (lumiSetting.get().addClientTag) {
        voteEventParams.tags?.push(clientTag);
      }

      const signer = nip07Signer();
      const signedEvent = await signer.signEvent(voteEventParams);
      const targetRelays = voteRelays.length > 0 ? voteRelays : undefined;

      const publishResult = await promisePublishSignedEvent(
        signedEvent,
        targetRelays,
      );

      if (publishResult.res.length > 0) {
        addToast({
          data: {
            title: "Voted",
            description: "",
            color: "bg-green-500",
          },
        });
        await fetchVoteEvents();
      } else {
        throw new Error("Publish failed");
      }
    } catch (error) {
      console.error("投票の送信に失敗しました:", error);
      addToast({
        data: {
          title: "Failed",
          description: "failed to vote",
          color: "bg-red-500",
        },
      });
    } finally {
      isSubmitting = false;
    }
  }

  function handleRefresh(): void {
    reset();
    fetchVoteEvents();
  }

  function getVotesForOption(optionId: string): Nostr.Event[] {
    return voteEvents.filter((ev) => getUserVoteValue(ev) === optionId);
  }

  $effect(() => {
    if (note) {
      untrack(() => {
        group = new RadioGroup({
          disabled: () => hasEnded || isLoading,
          value: "",
        });
        reset();
        fetchVoteEvents();
      });
    }
  });
</script>

<!-- isLoading中はpointer-eventsを無効化するフォールバック（extractがgetterを受け付けない場合の保険） -->
<div
  {...group?.root}
  style={isLoading ? "pointer-events: none; opacity: 0.6;" : undefined}
>
  <div {...group?.root} class="radio-group">
    {#if optionTags.length > 0}
      {#each optionTags as [_, id, label]}
        {@const item = group?.getItem(id)}
        {@const votesForOption = getVotesForOption(id)}

        <div class="radio-item">
          <div {...item?.attrs} class="radio-button">
            <div
              class={[
                "grid h-6 w-6 min-w-6 place-items-center rounded-full border shadow-sm",
                "bg-neutral-900",
                hasEnded || isLoading
                  ? "border-neutral-500"
                  : "border-magnum-500",
              ]}
            >
              {#if item?.checked}
                <div
                  class={[
                    "h-3 w-3 rounded-full",
                    hasEnded || isLoading ? "bg-neutral-500" : "bg-magnum-500",
                  ]}
                  aria-hidden="true"
                ></div>
              {/if}
            </div>

            <div class="text-gray-600 dark:text-gray-100 ml-1">
              <Content
                event={{ ...note, content: label }}
                displayTags={false}
                displayMenu={false}
                {depth}
                repostable={false}
              />
            </div>

            {#if isLoading}
              <span class="ml-auto italic text-neutral-500 text-sm pr-4"
                >loading...</span
              >
            {:else if userVoteEvent || hasEnded || lumiSetting.get().pubkey === (note?.pubkey || "")}
              <div
                class="ml-auto flex overflow-hidden items-center flex-row-reverse pr-4"
              >
                {#each votesForOption as voteEvent}
                  <div class="w-2 overflow-visible">
                    <Metadata
                      queryKey={["metadata", voteEvent.pubkey]}
                      pubkey={voteEvent.pubkey}
                    >
                      {#snippet loading()}
                        <UserPopupMenu
                          pubkey={voteEvent.pubkey}
                          metadata={undefined}
                          size={24}
                          {depth}
                        />
                      {/snippet}

                      {#snippet error()}
                        <UserPopupMenu
                          pubkey={voteEvent.pubkey}
                          metadata={undefined}
                          size={24}
                          {depth}
                        />
                      {/snippet}

                      {#snippet nodata()}
                        <UserPopupMenu
                          pubkey={voteEvent.pubkey}
                          metadata={undefined}
                          size={24}
                          {depth}
                        />
                      {/snippet}

                      {#snippet content({ metadata })}
                        <UserPopupMenu
                          pubkey={voteEvent.pubkey}
                          {metadata}
                          size={24}
                          {depth}
                        />
                      {/snippet}
                    </Metadata>
                  </div>
                {/each}
              </div>
              <div class="ml-2">{votesForOption.length}</div>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
    <input {...group?.hiddenInput} />
  </div>
</div>
<div class="flex justify-between items-center">
  {#if !hasEnded}
    {#if userVoteEvent}
      <button
        class="border border-magnum-500 hover:border-magnum-300 rounded-md px-2 py-1 w-fit font-semibold active:scale-90 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
        type="button"
        disabled={isSubmitting}
        onclick={submitVote}
      >
        {isSubmitting ? `${$_("poll.submitting")}` : `${$_("poll.change")}`}
      </button>
    {:else if group && group.value !== ""}
      <button
        class="border border-magnum-500 hover:border-magnum-300 rounded-md px-2 py-1 w-fit m-1 font-semibold active:scale-90 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
        type="button"
        disabled={isSubmitting}
        onclick={submitVote}
      >
        {isSubmitting ? `${$_("poll.submitting")}` : `${$_("poll.vote")}`}
      </button>
    {/if}
  {/if}
  {#if userVoteEvent || lumiSetting.get().pubkey === (note?.pubkey || "")}
    <button
      onclick={handleRefresh}
      title="Refresh poll results"
      class="ml-auto"
    >
      <RefreshCw
        class="rounded-full hover:bg-magnum-600/50 p-1 active:bg-magnum-600 text-magnum-200"
      />
    </button>
  {/if}
</div>

<style>
  .radio-group {
    margin: 6px 4px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .radio-item {
    display: flex;
    align-items: center;
  }

  .radio-button {
    display: flex;
    align-items: center;
    cursor: pointer;
    width: 100%;
  }

  .radio-button[data-disabled="true"] {
    cursor: not-allowed;
  }
</style>
