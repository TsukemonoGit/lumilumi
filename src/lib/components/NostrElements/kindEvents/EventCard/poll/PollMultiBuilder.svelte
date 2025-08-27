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
  import { RefreshCw } from "lucide-svelte";

  const {
    note,
    hasEnded,
    endsAt,
  }: { note: Nostr.Event; hasEnded: boolean; endsAt: number | undefined } =
    $props();

  const depth = 0;

  let userVoteEvent: Nostr.Event | undefined = $state();
  let voteEvents: Nostr.Event[] = $state([]);
  let voteRelays: string[] = $state([]);
  let selectedIds: string[] = $state([]);
  let isSubmitting: boolean = $state(false);

  const optionTags: string[][] = $derived(
    note?.tags?.filter((tag) => tag[0] === "option" && tag.length > 2) || []
  );

  // リセット処理
  function reset(): void {
    userVoteEvent = undefined;
    voteEvents = [];
    voteRelays = [];
    selectedIds = [];
    isSubmitting = false;
  }

  // リレーの抽出
  function extractVoteRelays(noteEvent: Nostr.Event): string[] {
    return noteEvent.tags.reduce((relays: string[], tag) => {
      if (tag[0] === "relay" && tag.length > 1) {
        return Array.from(new Set([...relays, tag[1]]));
      }
      return relays;
    }, []);
  }

  // 投票フィルターの作成
  function createVoteFilter(noteId: string, endTime?: number): Nostr.Filter {
    const filter: Nostr.Filter = { kinds: [1018], "#e": [noteId] };
    if (endTime) {
      filter.until = endTime;
    }
    return filter;
  }

  // ユーザーの投票値を取得（複数選択対応）
  function getUserVoteValues(voteEvent: Nostr.Event | undefined): string[] {
    if (!voteEvent) return [];

    const responseTags = voteEvent.tags.filter(
      (tag) => tag[0] === "response" && tag.length > 1
    );

    return responseTags.map((tag) => tag[1]);
  }

  // 投票イベントを取得
  async function fetchVoteEvents(): Promise<void> {
    voteRelays = extractVoteRelays(note);

    const filter = createVoteFilter(note.id, endsAt);
    const targetRelays = voteRelays.length > 0 ? voteRelays : undefined;

    const events = await usePromiseReq(
      {
        filters: [filter],
        operator: pipe(uniq(), latestEachPubkey()),
      },
      targetRelays
    );

    voteEvents = events?.map((ev) => ev.event) || [];
    userVoteEvent = voteEvents.find(
      (ev) => ev.pubkey === lumiSetting.get().pubkey
    );

    // ユーザーが過去に投票していた選択肢を取得して選択状態を復元
    selectedIds = userVoteEvent ? getUserVoteValues(userVoteEvent) : [];
    console.log("ユーザーの投票:", selectedIds);
  }

  // 選択状態の切り替え
  function toggleSelection(id: string): void {
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter((item) => item !== id);
    } else {
      selectedIds = [...selectedIds, id];
    }
  }

  // 選択肢が選択されているかチェック
  function isSelected(id: string): boolean {
    return selectedIds.includes(id);
  }

  // 投票送信処理
  async function submitVote(): Promise<void> {
    if (selectedIds.length === 0 || !lumiSetting.get().pubkey || isSubmitting)
      return;

    try {
      isSubmitting = true;

      const voteEventParams: Nostr.EventParameters = {
        kind: 1018,
        tags: [["e", note.id]],
        content: "",
      };

      // 選択した選択肢をタグに追加
      selectedIds.forEach((id) => {
        voteEventParams.tags?.push(["response", id]);
      });

      if (lumiSetting.get().addClientTag) {
        voteEventParams.tags?.push(clientTag);
      }

      console.log(voteEventParams);

      const signer = nip07Signer();
      const signedEvent = await signer.signEvent(voteEventParams);
      const targetRelays = voteRelays.length > 0 ? voteRelays : undefined;

      const publishResult = await promisePublishSignedEvent(
        signedEvent,
        targetRelays
      );

      if (publishResult.res.length > 0) {
        $toastSettings = {
          title: "Voted",
          description: "",
          color: "bg-green-500",
        };
        await fetchVoteEvents();
      } else {
        throw new Error("Publish failed");
      }
    } catch (error) {
      console.error("投票の送信に失敗しました:", error);
      $toastSettings = {
        title: "Failed",
        description: "failed to vote",
        color: "bg-red-500",
      };
    } finally {
      isSubmitting = false;
    }
  }

  // リフレッシュ処理
  function handleRefresh(): void {
    reset();
    fetchVoteEvents();
  }

  // 特定の選択肢に投票したイベントをフィルタリング
  function getVotesForOption(optionId: string): Nostr.Event[] {
    return voteEvents.filter((ev) => getUserVoteValues(ev).includes(optionId));
  }

  // エフェクト: noteが変更されたときの処理
  $effect(() => {
    if (note) {
      untrack(() => {
        reset();
        fetchVoteEvents();
      });
    }
  });
</script>

{#each optionTags as [_, id, label]}
  <label class="flex my-1 items-center">
    <input
      class="rounded-checkbox disabled:cursor-not-allowed min-w-6"
      type="checkbox"
      disabled={hasEnded}
      checked={isSelected(id)}
      onchange={() => toggleSelection(id)}
    />
    <span class="ml-2 break-all">
      <Content
        event={{ ...note, content: label }}
        displayTags={false}
        displayMenu={false}
        {depth}
        repostable={false}
      />
    </span>

    {#if userVoteEvent || hasEnded || lumiSetting.get().pubkey === note.pubkey}
      {@const votesForOption = getVotesForOption(id)}

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
  </label>
{/each}
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
    {:else if selectedIds.length > 0}
      <button
        class="border border-magnum-500 hover:border-magnum-300 rounded-md px-2 py-1 w-fit m-1 font-semibold active:scale-90 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
        type="button"
        disabled={isSubmitting}
        onclick={submitVote}
      >
        {isSubmitting ? `${$_("poll.submitting")}` : `${$_("poll.vote")}`}
      </button>
    {/if}
    {#if userVoteEvent || lumiSetting.get().pubkey === note.pubkey}
      <button
        onclick={handleRefresh}
        title="Refresh poll results"
        class=" ml-auto"
      >
        <RefreshCw
          class="rounded-full hover:bg-magnum-600/50 p-1 active:bg-magnum-600 text-magnum-200"
        />
      </button>
    {/if}{:else}
    <span class="italic text-neutral-500">loading...</span>
  {/if}
</div>
