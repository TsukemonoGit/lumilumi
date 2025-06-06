<script lang="ts">
  import UserName from "$lib/components/NostrElements/user/UserName.svelte";
  import UserZap from "$lib/components/NostrElements/user/UserZap.svelte";
  import { Zap } from "lucide-svelte";
  import { onMount } from "svelte";
  import UserPopupMenu from "../NostrElements/user/UserPopupMenu.svelte";

  let { metadata } = $props();
  let showCelebration = $state(true);
  let isFadingOut = $state(false);
  let characters: any[] = $state([]);
  let zapOpen = $state(false); // zapOpenの状態を追跡
  let animationTimer: ReturnType<typeof setTimeout>; // タイマー参照を保持
  let characterInterval: ReturnType<typeof setInterval>; // キャラクター生成インターバルの参照

  function getRandomCharacter() {
    const characters = [
      "🎉",
      "🎂",
      "🎁",
      "🎈",
      "🎈",
      "🎈",
      "🍰",
      "🍾",
      "⭐",
      "✨",
      "💫",
      "🌟",
      "🎊",
      "🎊",
      "🎊",
      "🎊",
      "🎊",
      "🎊",
      "🎊",
      "🎊",
      "🎊",
      "🎊",
      "🎊",
      "🎊",
    ];
    return characters[Math.floor(Math.random() * characters.length)];
  }

  // アニメーションタイマーをセットする関数
  function setAnimationTimer() {
    // 既存のタイマーがあればクリア
    if (animationTimer) {
      clearTimeout(animationTimer);
    }

    // 新しいタイマーをセット
    animationTimer = setTimeout(() => {
      // zapOpenがtrueの場合はタイマーを再設定
      if (zapOpen) {
        // タイマーを再設定（延長）
        setAnimationTimer();
      } else {
        // zapOpenがfalseならアニメーションを終了
        startFadeOut();
      }
    }, 8000);
  }

  // フェードアウトを開始する関数
  function startFadeOut() {
    isFadingOut = true;
    setTimeout(() => {
      showCelebration = false;
      if (characterInterval) {
        clearInterval(characterInterval);
      }
    }, 500); // フェードアウトアニメーションが完了するのを待つ
  }

  onMount(() => {
    // 初期のキャラクターバーストを作成
    for (let i = 0; i < 50; i++) {
      characters.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 8 + Math.random() * 8,
        character: getRandomCharacter(),
        size: 1.5 + Math.random() * 2,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      });
    }

    // キャラクターの連続ストリームを追加
    characterInterval = setInterval(() => {
      if (characters.length < 100) {
        characters.push({
          id: Date.now(),
          left: Math.random() * 100,
          delay: 0,
          duration: 8 + Math.random() * 8,
          character: getRandomCharacter(),
          size: 1.5 + Math.random() * 2,
          rotation: Math.random() * 360,
          scale: 0.5 + Math.random() * 0.5,
        });
      }
    }, 200);

    // アニメーションタイマーを設定
    setAnimationTimer();
  });
</script>

{#if showCelebration}
  <div class="celebration-content" class:fade-out={isFadingOut}>
    <div class="user-section">
      <UserPopupMenu
        pubkey={metadata.pubkey}
        size={64}
        {metadata}
        displayMenu={false}
        depth={0}
      />
      <div class="username-container">
        <UserName pubhex={metadata.pubkey} />
      </div>
    </div>
    <div class="message">
      <span class="birthday-text">Happy Birthday!</span>
      <span class="zap-icon">
        <UserZap {metadata} bind:zapOpen comment="Happy Birthday! 🎉">
          <Zap size="2rem" />
        </UserZap></span
      >
    </div>
  </div>

  {#each characters as character}
    <div
      class="character"
      class:fade-out={isFadingOut}
      style="
          left: {character.left}%;
          animation-delay: {character.delay}s;
          animation-duration: {character.duration}s;
          transform: rotate({character.rotation}deg) scale({character.scale});
          font-size: {character.size}rem;
        "
    >
      {character.character}
    </div>
  {/each}
{/if}

<style>
  .celebration-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    pointer-events: auto;
    animation: fadeIn 0.5s ease-out;
    background: rgba(255, 255, 255, 0.9);
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }

  .user-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .username-container {
    font-size: 1.5rem;
    font-weight: bold;
    color: #ff69b4;
    text-shadow: 0 0 10px rgba(255, 105, 180, 0.3);
  }

  .message {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
  }

  .birthday-text {
    font-size: 2rem;
    font-weight: bold;
    color: #ff69b4;
    text-shadow: 0 0 10px rgba(255, 105, 180, 0.3);
  }

  .zap-icon {
    color: #ffd700;
    filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .zap-icon:hover {
    transform: scale(1.2) rotate(180deg);
  }

  .character {
    position: absolute;
    bottom: -100px;
    animation: floatUp linear infinite;
    min-width: 2rem;
    text-align: center;
    filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
  }

  @keyframes floatUp {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(-110vh) rotate(360deg);
      opacity: 0;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  .fade-out {
    animation: fadeOut 0.5s ease-out forwards;
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
</style>
