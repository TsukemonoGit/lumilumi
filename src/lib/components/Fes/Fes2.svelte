<script lang="ts">
  import { onMount } from "svelte";
  import UserZap from "$lib/components/NostrElements/user/UserZap.svelte";
  import { Zap, Cake, Gift, Music, PartyPopper, Sparkles } from "lucide-svelte";
  import { profile } from "$lib/func/util";
  import UserName from "../NostrElements/user/UserName.svelte";
  import UserAvatar from "../NostrElements/user/UserAvatar.svelte";
  import UserPopupMenu from "../NostrElements/user/UserPopupMenu.svelte";

  interface Confetti {
    id: number; // 一意の識別子
    left: number; // 横方向の位置（%）
    delay: number; // アニメーションの遅延時間（秒）
    duration: number; // アニメーションの継続時間（秒）
    color: string; // 紙吹雪の色（CSSクラス名）
    size: number; // 紙吹雪のサイズ（rem）
    rotation: number; // 紙吹雪の回転角度（度）
    shape: "circle" | "square"; // 紙吹雪の形状
  }

  interface Present {
    id: number; // 一意の識別子
    left: number; // 横方向の位置（%）
    delay: number; // アニメーションの遅延時間（秒）
    style: string; // プレゼントのスタイル（CSSクラス名）
    size: number; // プレゼントのサイズ（rem）
    isZap: boolean; // Zapアイコンを表示するかどうか
  }

  let { metadata } = $props();
  let confetti: Confetti[] = $state([]);
  let presents: Present[] = $state([]);
  let cakeIsVisible = $state(false);
  let animationActive = $state(true);
  let containerOpacity = $state(1);

  // 色のテーマを設定
  const colors = [
    "from-pink-500 to-orange-400",
    "from-purple-500 to-indigo-500",
    "from-yellow-400 to-amber-500",
    "from-green-400 to-emerald-500",
    "from-blue-400 to-cyan-500",
  ];

  // ギフトのスタイル
  const giftStyles = [
    "from-red-500 to-pink-400 border-yellow-300",
    "from-blue-500 to-indigo-400 border-purple-300",
    "from-green-500 to-emerald-400 border-lime-300",
    "from-orange-500 to-amber-400 border-yellow-300",
  ];

  // ランダムな位置を生成
  function randomPosition() {
    return Math.random() * 100;
  }

  // ランダムな回転を生成
  function randomRotation() {
    return Math.floor(Math.random() * 360);
  }

  function getRandomItem(array: string | any[]) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // アニメーションを終了する
  function endAnimation() {
    // フェードアウト
    containerOpacity = 0;
    // フェードアウト後にアニメーションを非アクティブにする
    setTimeout(() => {
      animationActive = false;
    }, 1000);
  }

  onMount(() => {
    // 紙吹雪を生成
    for (let i = 0; i < 50; i++) {
      confetti.push({
        id: i,
        left: randomPosition(),
        delay: Math.random() * 3,
        duration: 4 + Math.random() * 6,
        color: getRandomItem(colors),
        size: 0.5 + Math.random() * 0.8,
        rotation: randomRotation(),
        shape: Math.random() > 0.5 ? "circle" : "square",
      });
    }

    // プレゼントを生成
    for (let i = 0; i < 8; i++) {
      presents.push({
        id: i,
        left: 10 + i * 10,
        delay: 1 + Math.random() * 2,
        style: getRandomItem(giftStyles),
        size: 3 + Math.random() * 2,
        isZap: i % 3 === 0, // いくつかのプレゼントはZapにする
      });
    }

    // ケーキのアニメーションを遅らせる
    setTimeout(() => {
      cakeIsVisible = true;
    }, 2000);

    // アニメーションを8秒後に自動的に終了
    setTimeout(() => {
      endAnimation();
    }, 8000);
  });
</script>

{#if animationActive}
  <div
    class="animation-container"
    style="opacity: {containerOpacity}; transition: opacity 1s ease-out;"
  >
    <!-- 背景のきらめき効果 -->
    <div
      class="fixed inset-0 overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-purple-900 bg-opacity-80 pointer-events-none"
    >
      {#each Array(20) as _, i}
        <div
          class="absolute rounded-full bg-white opacity-70 pointer-events-none"
          style="
            width: {0.2 + Math.random() * 0.3}rem; 
            height: {0.2 + Math.random() * 0.3}rem;
            left: {randomPosition()}%; 
            top: {randomPosition()}%;
            animation: twinkle {2 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: {Math.random() * 5}s;
          "
        ></div>
      {/each}
    </div>

    <!-- 紙吹雪 -->
    {#each confetti as item}
      <div
        class="confetti absolute pointer-events-none"
        style="
          left: {item.left}%;
          animation-delay: {item.delay}s;
          animation-duration: {item.duration}s;
          transform: rotate({item.rotation}deg);
        "
      >
        <div
          class={`bg-gradient-to-br ${item.color} ${item.shape === "circle" ? "rounded-full" : ""} pointer-events-none`}
          style="
            width: {item.size}rem;
            height: {item.size}rem;
          "
        ></div>
      </div>
    {/each}

    <!-- プレゼントボックス（下から上に現れる） -->
    {#each presents as present}
      <div
        class="present absolute bottom-0"
        style="
          left: {present.left}%;
          animation-delay: {present.delay}s;
        "
      >
        {#if present.isZap}
          <div class="zap-container relative z-50 cursor-pointer">
            <UserZap {metadata} comment="Happy Birthday🎉">
              <div class="flex flex-col items-center">
                <Zap
                  class="zap bg-gradient-to-r from-yellow-400 to-amber-500 stroke-purple-800 rounded-full hover:scale-110 active:scale-95 transition-transform"
                  size={present.size + "rem"}
                />
                <PartyPopper
                  class="text-yellow-400 animate-bounce mt-2"
                  size="1.5rem"
                />
              </div>
            </UserZap>
          </div>
        {:else}
          <div
            class={`gift bg-gradient-to-br ${present.style} p-2 rounded-lg border-2 flex items-center justify-center transform hover:scale-110 transition duration-300`}
            style="
              width: {present.size}rem;
              height: {present.size}rem;
            "
          >
            <Gift class="text-white" />
          </div>
        {/if}
      </div>
    {/each}

    <!-- 中央のケーキ -->
    {#if cakeIsVisible}
      <div
        class="cake-container fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
      >
        <div class="cake relative flex items-center justify-center">
          <Cake
            size="8rem"
            class="text-pink-400 filter drop-shadow-lg animate-pulse"
          />
          <Sparkles
            size="10rem"
            class="absolute text-yellow-400 animate-spin-slow opacity-70"
          />
        </div>

        <!-- タイトル -->
        <h1
          class="text-4xl font-bold mt-4 text-white text-center animated-text"
        >
          Happy Birthday!
        </h1>

        <!-- ユーザーアイコンとユーザー名 -->
        <div
          class="user-profile-container mt-3 mb-2 flex flex-col items-center"
        >
          <div class="user-icon-container mb-2">
            <UserPopupMenu
              pubkey={metadata.pubkey}
              size={42}
              {metadata}
              displayMenu={false}
              tieKey={undefined}
              depth={0}
            />
          </div>
          <div class="text-2xl font-medium text-center user-name-glow">
            <UserName pubhex={metadata.pubkey} />
          </div>
        </div>

        <!-- ミュージック -->
        <div class="music-notes mt-4 flex">
          {#each Array(3) as _, i}
            <Music
              size="1.5rem"
              class="text-white opacity-80 animate-bounce"
              style="animation-delay: {i * 0.3}s"
            />
          {/each}
        </div>
      </div>
    {/if}

    <!-- 閉じるボタン -->
    <button
      class="absolute top-4 right-4 bg-white bg-opacity-20 text-white rounded-full p-2 text-sm z-50 hover:bg-opacity-30 transition-all"
      onclick={endAnimation}
    >
      ✕
    </button>
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
    pointer-events: auto;
  }

  /* アニメーション定義 */
  @keyframes fallDown {
    0% {
      transform: translateY(-100vh) rotate(0deg);
    }
    100% {
      transform: translateY(100vh) rotate(360deg);
    }
  }

  @keyframes float {
    0% {
      transform: translateY(20vh) scale(0);
    }
    10% {
      transform: translateY(10vh) scale(1);
    }
    80% {
      transform: translateY(-5vh) scale(1);
    }
    100% {
      transform: translateY(-10vh) scale(0.8);
    }
  }

  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }

  @keyframes rainbow {
    0% {
      color: #ff9a9e;
    }
    20% {
      color: #fad0c4;
    }
    40% {
      color: #fbc2eb;
    }
    60% {
      color: #a6c1ee;
    }
    80% {
      color: #c2e9fb;
    }
    100% {
      color: #ff9a9e;
    }
  }

  /* スタイル適用 */
  .confetti {
    position: absolute;
    top: -5vh;
    z-index: 10;
    animation: fallDown linear forwards;
  }

  .present {
    animation: float 8s ease-out forwards;
    z-index: 20;
  }

  .zap-container {
    /* Zapコンポーネントのためのインタラクション設定 */
    position: relative;
    display: inline-block;
    cursor: pointer;
  }

  .zap {
    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
    animation: pulse 2s infinite;
  }

  .gift {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .cake-container {
    z-index: 30;
    animation: appear 1s ease-out forwards;
  }

  .animated-text {
    background: linear-gradient(90deg, #ff9a9e, #fad0c4, #fbc2eb, #a6c1ee);
    background-size: 300% 300%;
    animation: rainbow 4s linear infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  @keyframes appear {
    from {
      opacity: 0;
      transform: translate(-50%, -30%) scale(0.5);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  /* 特殊アニメーション */
  .animate-spin-slow {
    animation: spin 10s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .user-name-glow {
    color: #ffffff;
    text-shadow:
      0 0 10px rgba(255, 255, 255, 0.7),
      0 0 20px rgba(255, 215, 0, 0.5);
    animation: name-pulse 2s infinite;
    background: linear-gradient(90deg, #fff6e0, #ffeda0, #fff6e0);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  @keyframes name-pulse {
    0%,
    100% {
      background-position: 0% center;
    }
    50% {
      background-position: 100% center;
    }
  }

  .user-icon-container {
    border-radius: 50%;
    padding: 3px;
    background: linear-gradient(45deg, #ffd700, #ff007f);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
    animation: border-pulse 3s infinite;
  }

  @keyframes border-pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
  }
</style>
