<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { RadioGroup } from "melt/builders";
  import { promisePublishSignedEvent, usePromiseReq } from "$lib/func/nostr";
  import { pipe } from "rxjs";
  import { nip07Signer, uniq } from "rx-nostr";
  import { loginUser, toastSettings } from "$lib/stores/stores";
  import { untrack } from "svelte";
  import { _ } from "svelte-i18n";
  import { latestEachPubkey } from "$lib/stores/operators";
  import UserPopupMenu from "$lib/components/NostrElements/user/UserPopupMenu.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  let { note, hasEnded }: { note: Nostr.Event; hasEnded: boolean } = $props();
  let group: RadioGroup | undefined = $state();
  let optionTags: string[][] = $derived(
    note.tags.filter((tag) => tag[0] === "option" && tag.length > 2)
  );
  let isSubmitting: boolean = $state(false); // 投票送信中かどうかのフラグ
  const tieKey = undefined;
  const depth = 0;
  let userVoteEvent: Nostr.Event | undefined = $state();
  $inspect(optionTags);

  let voteEvents: Nostr.Event[] = $state([]);

  //過去投票済みの場合は結果を表示
  //投票してなかったら結果を出しつつ投票メニュー（投票を変更）
  $effect(() => {
    if (note) {
      //のてがかわるたびにちぇっく
      untrack(() => {
        getVotedEvents();
      });
    }
  });

  let voteRelays: string[] = $state([]);
  async function getVotedEvents() {
    voteRelays = note.tags.reduce((pre, cur) => {
      if (cur[0] === "relay" && cur.length > 1) {
        return Array.from(new Set([...pre, cur[1]]));
      }
      return pre; // Return the accumulator unchanged if condition not met
    }, []); // Initial value should be an empty array

    voteEvents = (
      await usePromiseReq(
        {
          filters: [{ kinds: [1018], "#e": [note.id] }],
          operator: pipe(uniq(), latestEachPubkey()),
        },
        voteRelays.length > 0 ? voteRelays : undefined
      )
    )?.map((evs) => evs.event);
    userVoteEvent = voteEvents.find((ev) => ev.pubkey === $loginUser);
    const value = getVoted(userVoteEvent);

    group = new RadioGroup({ disabled: hasEnded, value: value });
  }
  function getVoted(ev: Nostr.Event | undefined): string {
    if (!ev) {
      return "";
    }

    const res = ev.tags.find((tag) => tag[0] === "response" && tag.length > 1);
    if (!res) {
      return "";
    }

    const op = optionTags.find((op) => op[1] === res[1]);
    if (!op) {
      return "";
    }
    return op[1];
  }
  $inspect(voteEvents);

  //--------
  const handleClickVote = async () => {
    console.log(group?.value);
    if (!group?.value || !$loginUser || isSubmitting) return;

    try {
      isSubmitting = true;

      // 投票イベントの作成
      // 選択した選択肢をタグに追加
      const voteEvent: Nostr.EventParameters = {
        kind: 1018,
        tags: [
          ["e", note.id],
          ["response", group.value],
        ],
        content: "",
      };

      console.log(voteEvent);

      const signer = nip07Signer();
      const event = await signer.signEvent(voteEvent);

      const res = await promisePublishSignedEvent(
        event,
        voteRelays.length > 0 ? voteRelays : undefined
      );
      if (res.res.length > 0) {
        $toastSettings = {
          title: "Voted",
          description: "",
          color: "bg-green-500",
        };
      } else {
        $toastSettings = {
          title: "Failed",
          description: "failed to vote",
          color: "bg-red-500",
        };
      }

      // 投票リストを更新
      await getVotedEvents();
    } catch (error) {
      $toastSettings = {
        title: "Failed",
        description: "failed to vote",
        color: "bg-red-500",
      };
      console.error("投票の送信に失敗しました:", error);
    } finally {
      isSubmitting = false;
    }
  };
</script>

{#if group}
  <div {...group.root}>
    <div {...group.root} class="radio-group">
      {#if optionTags.length > 0}
        {#each optionTags as [_, id, label]}
          {@const item = group.getItem(id)}
          <div class="radio-item">
            <div {...item.attrs} class="radio-button">
              <div
                class={[
                  "grid h-6 w-6 min-w-6 place-items-center rounded-full border shadow-sm ",
                  "bg-neutral-900 border-magnum-500 ",
                  `${hasEnded ? "border-neutral-500" : "border-magnum-500"}`,
                ]}
              >
                {#if item.checked}
                  <div
                    class={[
                      "h-3 w-3 rounded-full",
                      item.checked &&
                        `${hasEnded ? "bg-neutral-500" : "bg-magnum-500"}`,
                    ]}
                    aria-hidden="true"
                  ></div>
                {/if}
              </div>
              <div class="leading-none text-gray-600 dark:text-gray-100 ml-1">
                {label}
              </div>

              {#if userVoteEvent || hasEnded}
                {@const evs = voteEvents.filter((ev) => getVoted(ev) === id)}

                <div
                  class="ml-auto flex overflow-hidden items-center flex-row-reverse pr-4"
                >
                  {#each evs as ev}
                    <div class="w-2 overflow-visible">
                      <Metadata
                        queryKey={["metadata", ev.pubkey]}
                        pubkey={ev.pubkey}
                      >
                        {#snippet loading()}
                          <UserPopupMenu
                            pubkey={ev.pubkey}
                            metadata={undefined}
                            size={24}
                            {depth}
                            {tieKey}
                          />
                        {/snippet}

                        {#snippet error()}
                          <UserPopupMenu
                            pubkey={ev.pubkey}
                            metadata={undefined}
                            size={24}
                            {depth}
                            {tieKey}
                          />
                        {/snippet}

                        {#snippet nodata()}
                          <UserPopupMenu
                            pubkey={ev.pubkey}
                            metadata={undefined}
                            size={24}
                            {depth}
                            {tieKey}
                          />
                        {/snippet}

                        {#snippet content({ metadata })}
                          <UserPopupMenu
                            pubkey={ev.pubkey}
                            {metadata}
                            size={24}
                            {depth}
                            {tieKey}
                          />
                        {/snippet}
                      </Metadata>
                    </div>
                  {/each}
                </div>
                <div class="ml-2">{evs.length}</div>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
      <input {...group.hiddenInput} />
    </div>
  </div>
  {#if !hasEnded}
    {#if userVoteEvent}
      <div class="flex items-center my-2">
        <button
          class="border border-magnum-500 hover:border-magnum-300 rounded-md px-2 py-1 w-fit font-semibold active:scale-90 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          type="button"
          disabled={isSubmitting}
          onclick={handleClickVote}
        >
          {isSubmitting ? `${$_("poll.submitting")}` : `${$_("poll.change")}`}
        </button>
      </div>
    {:else if group && group.value !== ""}
      <button
        class="border border-magnum-500 hover:border-magnum-300 rounded-md px-2 py-1 w-fit m-1 font-semibold active:scale-90 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
        type="button"
        disabled={isSubmitting}
        onclick={handleClickVote}
      >
        {isSubmitting ? `${$_("poll.submitting")}` : `${$_("poll.vote")}`}
      </button>
    {/if}
  {/if}
{:else}
  <span class="italic text-neutral-500"> loaging...</span>
{/if}

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
