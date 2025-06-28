<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { promisePublishSignedEvent, usePromiseReq } from "$lib/func/nostr";
  import { pipe } from "rxjs";
  import { nip07Signer, uniq } from "rx-nostr";
  import { toastSettings } from "$lib/stores/stores";
  import { untrack } from "svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { latestEachPubkey } from "$lib/stores/operators";
  import UserPopupMenu from "$lib/components/NostrElements/user/UserPopupMenu.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { clientTag } from "$lib/func/constants";
  import Content from "$lib/components/NostrElements/content/Content.svelte";

  let {
    note,
    hasEnded,
    endsAt,
  }: { note: Nostr.Event; hasEnded: boolean; endsAt: number | undefined } =
    $props();

  let userVoteEvent: Nostr.Event | undefined = $state(); //このユーザーの投票
  let voteEvents: Nostr.Event[] = $state([]);
  let voteRelays: string[] = $state([]);
  let isSubmitting: boolean = $state(false); // 投票送信中かどうかのフラグ

  let optionTags: string[][] = $derived(
    note?.tags?.filter((tag) => tag[0] === "option" && tag.length > 2)
  );
  let selectedIds: string[] = $state([]);

  const depth = 0;

  //過去投票済みの場合は結果を表示
  //投票してなかったら結果を出しつつ投票メニュー（投票を変更）
  $effect(() => {
    if (note) {
      //noteが変わるたびにチェック
      untrack(() => {
        getVotedEvents();
      });
    }
  });

  async function getVotedEvents() {
    voteRelays = note.tags.reduce((pre, cur) => {
      if (cur[0] === "relay" && cur.length > 1) {
        return Array.from(new Set([...pre, cur[1]]));
      }
      return pre; // Return the accumulator unchanged if condition not met
    }, [] as string[]); // Initial value should be an empty array
    let filter: Nostr.Filter = { kinds: [1018], "#e": [note.id] };
    if (endsAt) {
      filter = { ...filter, until: endsAt };
    }
    voteEvents =
      (
        await usePromiseReq(
          {
            filters: [filter],
            operator: pipe(uniq(), latestEachPubkey()),
          },
          voteRelays.length > 0 ? voteRelays : undefined
        )
      )?.map((evs) => evs.event) || [];

    userVoteEvent = voteEvents.find(
      (ev) => ev.pubkey === lumiSetting.get().pubkey
    );

    // ユーザーが過去に投票していた選択肢を取得して選択状態を復元
    if (userVoteEvent) {
      selectedIds = getVotes(userVoteEvent);
    } else {
      selectedIds = [];
    }
    console.log("ユーザーの投票:", selectedIds);
  }

  function getVotes(ev: Nostr.Event | undefined): string[] {
    if (!ev) {
      return [];
    }

    const res = ev.tags.filter(
      (tag) => tag[0] === "response" && tag.length > 1
    );
    if (res.length <= 0) {
      return [];
    }

    return res.map((re) => re[1]);
  }

  function selectChange(id: string) {
    // チェックボックスの選択状態を更新
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter((item) => item !== id);
    } else {
      selectedIds = [...selectedIds, id];
    }
    //console.log("選択された選択肢:", selectedIds);
  }

  const handleClickVote = async () => {
    if (selectedIds.length === 0 || !lumiSetting.get().pubkey || isSubmitting)
      return;

    try {
      isSubmitting = true;

      // 投票イベントの作成
      const voteEvent: Nostr.EventParameters = {
        kind: 1018,
        tags: [["e", note.id]],
        content: "",
      };

      // 選択した選択肢をタグに追加
      selectedIds.forEach((id) => {
        voteEvent.tags?.push(["response", id]);
      });
      if (lumiSetting.get().addClientTag) {
        voteEvent.tags?.push(clientTag);
      }
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
      console.error("投票の送信に失敗しました:", error);
    } finally {
      isSubmitting = false;
    }
  };

  // 選択肢が選択されているかチェックするヘルパー関数
  function isSelected(id: string): boolean {
    return selectedIds.includes(id);
  }
</script>

{#each optionTags as [_, id, label]}
  <label class="flex my-1 items-center">
    <input
      class="rounded-checkbox disabled:cursor-not-allowed min-w-6"
      type="checkbox"
      disabled={hasEnded}
      checked={isSelected(id)}
      onchange={() => selectChange(id)}
    />
    <span class="ml-2 break-all">
      <Content
        event={{
          ...note,
          content: label,
        }}
        displayTags={false}
        displayMenu={false}
        {depth}
        repostable={false}
      /></span
    >

    {#if userVoteEvent || hasEnded || lumiSetting.get().pubkey === note.pubkey}
      {@const evs = voteEvents.filter((ev) =>
        getVotes(ev).find((v) => v === id)
      )}

      <div
        class="ml-auto flex overflow-hidden items-center flex-row-reverse pr-4"
      >
        {#each evs as ev}
          <div class="w-2 overflow-visible">
            <Metadata queryKey={["metadata", ev.pubkey]} pubkey={ev.pubkey}>
              {#snippet loading()}
                <UserPopupMenu
                  pubkey={ev.pubkey}
                  metadata={undefined}
                  size={24}
                  {depth}
                />
              {/snippet}

              {#snippet error()}
                <UserPopupMenu
                  pubkey={ev.pubkey}
                  metadata={undefined}
                  size={24}
                  {depth}
                />
              {/snippet}

              {#snippet nodata()}
                <UserPopupMenu
                  pubkey={ev.pubkey}
                  metadata={undefined}
                  size={24}
                  {depth}
                />
              {/snippet}

              {#snippet content({ metadata })}
                <UserPopupMenu
                  pubkey={ev.pubkey}
                  {metadata}
                  size={24}
                  {depth}
                />
              {/snippet}
            </Metadata>
          </div>
        {/each}
      </div>
      <div class="ml-2">{evs.length}</div>
    {/if}
  </label>
{/each}

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
  {:else if selectedIds.length > 0}
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
