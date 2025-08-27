<script lang="ts">
  import { onMount } from "svelte";
  import UserZap from "$lib/components/NostrElements/user/UserZap.svelte";

  import UserPopupMenu from "$lib/components/NostrElements/user/UserPopupMenu.svelte";
  import { Zap, Cake, Sparkles, Star } from "lucide-svelte";
  import UserName from "../NostrElements/user/UserName.svelte";

  const { metadata } = $props();
  const fireworks: any[] = $state([]);
  const balloons: any[] = $state([]);
  const stars: any[] = $state([]);
  let cakeVisible = $state(false);
  let animationActive = $state(true);
  let zapOpen = $state(false); // zapOpenの状態を追跡
  let animationTimer: ReturnType<typeof setTimeout> | null; // アニメーションタイマーの参照を保持

  const colors = [
    "from-red-500 to-yellow-400",
    "from-blue-500 to-green-400",
    "from-purple-500 to-pink-400",
  ];
  const balloonColors = [
    "bg-red-400",
    "bg-blue-400",
    "bg-yellow-400",
    "bg-green-400",
    "bg-purple-400",
  ];

  function randomPosition() {
    return Math.random() * 100;
  }

  function getRandomItem(array: any[]) {
    return array[Math.floor(Math.random() * array.length)];
  }

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
    animationActive = false;
    // タイマーをクリア
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
  }

  onMount(() => {
    // 花火を生成
    for (let i = 0; i < 20; i++) {
      fireworks.push({
        id: i,
        left: randomPosition(),
        top: randomPosition(),
        delay: Math.random() * 2,
        size: 2 + Math.random() * 3,
        color: getRandomItem(colors),
      });
    }

    // 風船を生成
    for (let i = 0; i < 15; i++) {
      balloons.push({
        id: i,
        left: randomPosition(),
        delay: Math.random() * 5, // アニメーション遅延をランダム化
        size: 3 + Math.random() * 2,
        color: getRandomItem(balloonColors),
      });
    }

    // 星を生成
    for (let i = 0; i < 30; i++) {
      stars.push({
        id: i,
        left: randomPosition(),
        top: Math.random() * 10, // 上部に配置
        delay: Math.random() * 5,
        size: 0.5 + Math.random() * 1.5,
      });
    }

    // ケーキを表示
    setTimeout(() => {
      cakeVisible = true;
    }, 3000);

    // アニメーションタイマーを設定
    setAnimationTimer();
  });
</script>

{#if animationActive}
  <div class="animation-container">
    <!-- 背景 -->
    <div class="background-gradient"></div>

    <!-- 星 -->
    {#each stars as star}
      <div
        class="star"
        style="
          left: {star.left}%;
          top: {star.top}%;
          animation-delay: {star.delay}s;
          font-size: {star.size}rem;
        "
      >
        <Star />
      </div>
    {/each}

    <!-- 花火 -->
    {#each fireworks as firework}
      <div
        class="firework"
        style="
          left: {firework.left}%;
          top: {firework.top}%;
          animation-delay: {firework.delay}s;
        "
      >
        <div
          class={`firework-piece ${firework.color}`}
          style="width: {firework.size}rem; height: {firework.size}rem;"
        ></div>
      </div>
    {/each}

    <!-- 風船 -->
    {#each balloons as balloon}
      <div
        class={`balloon ${balloon.color}`}
        style="
          left: {balloon.left}%;
          animation-delay: {balloon.delay}s;
          animation-duration: 6s; /* アニメーションの持続時間を調整 */
          width: {balloon.size}rem;
          height: {balloon.size * 1.2}rem;
        "
      ></div>
    {/each}

    <!-- ケーキとユーザー情報 -->
    {#if cakeVisible}
      <div class="cake-container">
        <Cake size="6rem" class="cake-icon" />
        <div class="title-grid">
          <span class="title-deco"><Sparkles size={42} /></span>
          <h1 class="title">Happy Birthday!</h1>
          <span class="title-deco"><Sparkles size={42} /></span>
        </div>
        <div class="user-info">
          <UserPopupMenu
            pubkey={metadata.pubkey}
            size={64}
            {metadata}
            displayMenu={false}
            depth={0}
          />
          <div class="username">
            <UserName pubhex={metadata.pubkey} />
          </div>
        </div>
        <UserZap {metadata} bind:zapOpen comment="Happy Birthday🎉">
          <div class="zap-button">
            <Zap class="zap-icon" size="2rem" />
          </div>
        </UserZap>
      </div>
    {/if}

    <!-- 閉じるボタン -->
    <button class="close-btn" onclick={endAnimation}>✕</button>
  </div>
{/if}

<style>
  .animation-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    overflow: hidden;
    pointer-events: auto;
  }

  .background-gradient {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, #1e3a8a, #3b82f6);
    z-index: -1;
  }

  .firework {
    position: absolute;
    animation: explode 1s ease-out infinite;
  }

  .firework-piece {
    border-radius: 50%;
    opacity: 0.8;
  }

  .balloon {
    position: absolute;
    bottom: -10%; /* 初期位置を画面外の下に設定 */
    animation: floatUp 6s ease-in-out infinite; /* アニメーションの持続時間を調整 */
    border-radius: 50%;
  }

  .star {
    position: absolute;
    color: #ffd700;
    animation: twinkle 2s ease-in-out infinite;
    z-index: 10;
  }

  .cake-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    animation: fadeIn 1s ease-out;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem; /* 行間を広げる */
    padding: 1.5rem;
  }

  .cake-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .cake-icon {
    z-index: 2;
    filter: drop-shadow(0 0 10px rgba(255, 105, 180, 0.8));
  }

  .title-grid {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1rem;
  }

  .title {
    line-height: 1.5em;
    font-size: 1.8rem;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
    text-align: center;
    word-wrap: break-word; /* テキストが長い場合に改行を許可 */
  }

  .title-deco {
    font-size: 2rem;
    color: #ffd700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
  }

  .zap {
    margin-top: 1rem;
    pointer-events: auto;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem; /* 行間を広げる */
  }

  .username {
    font-size: 1.5rem;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(255, 255, 255, 0.8);
    border: none;
    border-radius: 50%;
    padding: 0.5rem;
    cursor: pointer;
    font-size: 1.5rem;
    transition: background 0.3s ease;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 1);
  }

  @keyframes explode {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }

  @keyframes floatUp {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(-120vh); /* 画面外の上まで移動 */
      opacity: 0;
    }
  }

  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
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

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .zap-button {
    background: radial-gradient(circle, #ff7eb3, #ff758c, #ff6a66);
    border: 4px solid #fff;
    border-radius: 50%;
    padding: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow:
      0 0 20px rgba(255, 105, 135, 0.8),
      0 0 40px rgba(255, 105, 135, 0.6);
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
  }

  .zap-button:hover {
    transform: scale(1.2) rotate(15deg);
    box-shadow:
      0 0 30px rgba(255, 105, 135, 1),
      0 0 60px rgba(255, 105, 135, 0.8);
  }

  .zap-icon {
    color: #fff;
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.8));
  }
</style>
