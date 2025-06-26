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
  });

  const progressCallback: ProgressCallback = (current, total, details) => {
    let percent = 0;

    // chunk進捗（最大80%）
    if (details?.chunkCount && details?.currentChunk) {
      const chunkRatio = details.currentChunk / details.chunkCount;
      percent = Math.floor(chunkRatio * 80);
    }

    // chunk完了後、後処理進捗（最大20%）
    if (
      details?.chunkCount === details?.currentChunk &&
      details?.processedCount !== undefined &&
      details?.totalEmojis
    ) {
      const postRatio = details.totalEmojis
        ? details.processedCount / details.totalEmojis
        : 0;
      percent = 80 + Math.floor(postRatio * 20);
    }

    progress.value = Math.min(percent, 100);

    progressState = {
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
    };
  };

  async function handleClickEmoji() {
    $nowProgress = true;
    resetProgress();

    let pubkey: string = "";
    const beforeEvent = $emojis?.event;

    try {
      if (!loginUser.get()) {
        const got = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
        if (got) loginUser.set(got);
      }
      pubkey = loginUser.get() ?? "";
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

    localStorage.setItem("lumiEmoji", JSON.stringify($emojis));
    rxNostr.dispose();
    $nowProgress = false;

    setTimeout(() => resetProgress(), 2000);
  }
</script>

<!-- ✅ UI部分 -->
<button
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
      {#if progressState.details.chunkCount || 0 > 0}
        チャンク {progressState.details.currentChunk}/{progressState.details
          .chunkCount}
      {:else if progressState.details.totalEmojis || 0 > 0}
        統合中... ({progressState.details.processedCount}/{progressState.details
          .totalEmojis})
      {:else}
        処理中...
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
