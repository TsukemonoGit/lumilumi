<script lang="ts">
  import UserZap from "$lib/components/NostrElements/user/UserZap.svelte";
  import UserPopupMenu from "$lib/components/NostrElements/user/UserPopupMenu.svelte";
  import UserName from "../NostrElements/user/UserName.svelte";
  import { X } from "lucide-svelte";
  import { onMount } from "svelte";

  let { metadata } = $props();
  let zapOpen = $state(false);
  let visible = $state(true);
  let fadingOut = $state(false);
  let animationTimer: ReturnType<typeof setTimeout> | null; // アニメーションタイマーの参照を保持
  // アニメーションタイマーをセットする関数
  function setAnimationTimer() {
    // 既存のタイマーがあればクリア
    if (animationTimer) {
      clearTimeout(animationTimer);
    }

    // 新しいタイマーをセット
    animationTimer = setTimeout(() => {
      // タイマー終了時にzapOpenがtrueの場合は延長
      if (zapOpen) {
        // タイマーを再設定（延長）
        setAnimationTimer();
      } else {
        // zapOpenがfalseならアニメーションを終了
        endAnimation();
      }
    }, 12000); // 元のタイマーと同じ12秒に設定
  }
  function endAnimation() {
    visible = false;
    // タイマーをクリア
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
  }

  onMount(() => {
    // アニメーションタイマーを設定
    setAnimationTimer();
  });
  function close() {
    fadingOut = true;
    setTimeout(() => (visible = false), 500);
  }

  setTimeout(close, 10000);
</script>

{#if visible}
  <div
    class="birthday-fes fixed top-4 left-1/2 z-50 w-full max-w-sm flex flex-col items-center gap-2 p-6 border rounded-2xl shadow-2xl transition-opacity duration-500 animate-fade-in bg-gradient-light dark:bg-gradient-dark border-yellow-300 dark:border-yellow-600"
    class:fade-out={fadingOut}
    style="transform: translateX(-50%);"
  >
    <button
      onclick={close}
      class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xl pointer-events-auto"
    >
      <X class="w-6 h-6" />
    </button>

    <div class="text-xl animate-bounce">🎉</div>

    <UserPopupMenu
      pubkey={metadata.pubkey}
      size={80}
      {metadata}
      displayMenu={false}
      depth={0}
    />

    <UserName pubhex={metadata.pubkey} />

    <p
      class="text-xl font-bold text-rose-600 dark:text-rose-300 animate-pop text-center"
    >
      🎂 Happy Birthday! 🎂
    </p>

    <UserZap {metadata} bind:zapOpen comment="Happy Birthday🎉">
      <button
        class="bg-gradient-to-r from-pink-400 to-yellow-400 hover:from-pink-500 hover:to-yellow-500 text-white font-semibold py-2 px-6 rounded-full shadow-md transition-transform transform hover:scale-105 pointer-events-auto"
      >
        Send a Birthday ZAP ⚡
      </button>
    </UserZap>

    <div class="text-sm text-gray-500 dark:text-gray-400 italic text-center">
      Let's celebrate their special day! 🎈
    </div>
  </div>
{/if}

<style>
  .animate-fade-in {
    animation: fade-in 0.8s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .fade-out {
    opacity: 0;
  }

  .animate-pop {
    animation: pop 0.6s ease-out;
  }

  @keyframes pop {
    0% {
      transform: scale(0.8);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .animate-bounce {
    animation: bounce 1.2s infinite;
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .bg-gradient-light {
    background-image: linear-gradient(
      to bottom right,
      #fce7f3,
      #fefce8,
      #fce7f3
    );
  }

  @media (prefers-color-scheme: dark) {
    .bg-gradient-light {
      background-image: linear-gradient(
        to bottom right,
        #4c1d95,
        #7c3aed,
        #4c1d95
      );
    }
  }
</style>
