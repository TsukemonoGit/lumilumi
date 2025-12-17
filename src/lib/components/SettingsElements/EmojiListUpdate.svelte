<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import {
    createEmojiListFrom10030,
    getDoukiList,
    getQueryRelays,
    type ProgressCallback,
    type ProgressDetails,
  } from "$lib/func/settings";
  import { emojis, nowProgress, toastSettings } from "$lib/stores/stores";
  import { t as _ } from "@konemono/svelte5-i18n";

  import { createRxNostr } from "rx-nostr/src";
  import { verifier as cryptoVerifier } from "rx-nostr-crypto";
  import { loginUser, verifier } from "$lib/stores/globalRunes.svelte";

  import { Progress } from "melt/builders";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";

  interface Props {
    buttonClass?: string;
    children?: () => any;
  }

  let { buttonClass, children }: Props = $props();
  const progress = new Progress();

  let progressState = $state({
    details: {
      chunkCount: 0,
      directEmojiCount: 0,
      filterCount: 0,
      processedCount: 0,
      currentChunk: 0,
      chunkResultCount: 0,
      totalEmojis: 0,
    } as ProgressDetails,
    completedChunks: new Set<number>(),
    maxPercent: 0, // 最大進捗を記録
  });

  const progressCallback: ProgressCallback = (current, total, details) => {
    let percent = 0;

    // ステップ1: 直接絵文字抽出（0-5%）
    if (current === 1 && total === 4) {
      percent = 5;
    }
    // ステップ2: フィルター作成（5-15%）
    else if (current === 2 && total === 4) {
      percent = 15;
    }
    // ステップ3: 並列処理（15-85%）
    else if (current === 3 && total === 4) {
      if (details?.chunkCount && details.processedCount !== undefined) {
        const chunkProgress = details.processedCount / details.chunkCount;
        percent = 15 + Math.floor(chunkProgress * 70); // 15% + (0-70%)
      } else {
        percent = 15;
      }
    }
    // ステップ4: 統合処理（85-100%）
    else if (current === 4 && total === 4) {
      if (details?.totalEmojis !== undefined) {
        percent = 100;
      } else {
        percent = 85;
      }
    }

    // 進捗の後退を防ぐ
    progressState.maxPercent = Math.max(progressState.maxPercent, percent);
    progress.value = progressState.maxPercent;

    progressState = {
      ...progressState,
      details: {
        chunkCount: details?.chunkCount ?? progressState.details.chunkCount,
        currentChunk:
          details?.currentChunk ?? progressState.details.currentChunk,
        processedCount:
          details?.processedCount ?? progressState.details.processedCount,
        totalEmojis: details?.totalEmojis ?? progressState.details.totalEmojis,
        directEmojiCount:
          details?.directEmojiCount ?? progressState.details.directEmojiCount,
        filterCount: details?.filterCount ?? progressState.details.filterCount,
        chunkResultCount:
          details?.chunkResultCount ?? progressState.details.chunkResultCount,
      },
    };
  };

  const resetProgress = () => {
    progress.value = 0;

    progressState = {
      details: {
        chunkCount: 0,
        directEmojiCount: 0,
        filterCount: 0,
        processedCount: 0,
        currentChunk: 0,
        chunkResultCount: 0,
        totalEmojis: 0,
      },
      completedChunks: new Set<number>(),
      maxPercent: 0,
    };
  };

  async function handleClickEmoji() {
    $nowProgress = true;
    resetProgress();

    let pubkey: string = "";
    const beforeEvent = $emojis?.event;

    try {
      if (!loginUser.value) {
        const got = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
        if (got) loginUser.value = got;
      }
      pubkey = loginUser.value ?? "";
    } catch (error) {
      console.error(error);
    }

    if (!pubkey) {
      $toastSettings = {
        title: "Error",
        description: "pubkey not found",
        color: "bg-red-500",
      };
      $nowProgress = false;
      return;
    }
    progress.value++;
    const relays = await getQueryRelays(pubkey);
    console.log(relays);
    if (!relays) {
      $toastSettings = {
        title: "Error",
        description: "relay list not found",
        color: "bg-red-500",
      };
      $nowProgress = false;
      resetProgress();
      return;
    }

    progress.value++;
    const filters: Nostr.Filter[] = [
      { limit: 1, kinds: [10030], authors: [pubkey] },
    ];
    //console.log(filters);
    const pk = await getDoukiList(filters, relays);

    if (!pk && !beforeEvent) {
      $toastSettings = {
        title: "Warning",
        description: "emoji list not found",
        color: "bg-red-500",
      };
      $nowProgress = false;
      resetProgress();
      return;
    }
    progress.value++;
    const kind10030event =
      !beforeEvent ||
      beforeEvent.pubkey !== pk.event.pubkey ||
      pk.event.created_at >= beforeEvent.created_at
        ? pk.event
        : beforeEvent;

    const rxNostr = createRxNostr({
      verifier: verifier.get() ?? cryptoVerifier,
    });

    const list = await createEmojiListFrom10030(
      kind10030event,
      rxNostr,
      relays,
      progressCallback
    );

    $emojis = {
      list,
      updated: Math.floor(Date.now() / 1000),
      event: kind10030event,
    };
    try {
      localStorage.setItem(STORAGE_KEYS.LUMI_EMOJI, JSON.stringify($emojis));
    } catch (error) {
      console.log("failed to save localStorage");
    }
    rxNostr.dispose();
    $nowProgress = false;

    setTimeout(() => resetProgress(), 2000);
  }
</script>

<!-- ✅ UI部分 -->
<button
  type="button"
  class={buttonClass ||
    "hover:opacity-75 active:opacity-50 disabled:opacity-25"}
  disabled={$nowProgress}
  onclick={handleClickEmoji}
  title="update emoji list"
>
  {@render children?.()}
</button>

{#if progress.value > 0}
  <div
    class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 min-w-80 max-w-md"
  >
    <div {...progress.root}>
      <div {...progress.progress}></div>
    </div>
    <div class="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">
      {#if progressState.details.chunkCount && progressState.details.chunkCount > 0}
        {#if progressState.details.totalEmojis && progressState.details.totalEmojis > 0}
          {$_("process.merging")}... ({progressState.details.totalEmojis} emojis)
        {:else if progressState.details.filterCount}
          (filters: {progressState.details.filterCount})
        {/if}
      {:else}
        {$_("process.processing")}...
      {/if}
    </div>
  </div>
{/if}

<!-- ✅ スタイル -->
<style>
  [data-melt-progress-root] {
    height: 1.5rem;
    width: 300px;
    background-color: rgb(229 231 235);
    border-radius: 9999px;
    overflow: hidden;
  }

  :global(.dark) [data-melt-progress-root] {
    background-color: rgb(55 65 81);
  }

  [data-melt-progress-progress] {
    height: 100%;
    background-color: rgb(59 130 246);
    border-radius: 9999px;
    transition: transform 0.3s ease-out;
    transform: translateX(calc(var(--progress) * -1));
  }
</style>
