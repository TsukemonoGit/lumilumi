<script lang="ts">
  import { onMount } from "svelte";
  import UserZap from "$lib/components/NostrElements/user/UserZap.svelte";
  import UserPopupMenu from "$lib/components/NostrElements/user/UserPopupMenu.svelte";
  import { Zap, Cake, Sparkles, Star } from "lucide-svelte";
  import UserName from "../NostrElements/user/UserName.svelte";

  const { metadata } = $props();

  // 'any' を置き換えるための型定義
  type Firework = {
    id: number;
    left: number;
    top: number;
    delay: number;
    size: number;
    color: string;
  };

  type Balloon = {
    id: number;
    left: number;
    delay: number;
    size: number;
    color: string;
  };

  type Star = {
    id: number;
    left: number;
    top: number;
    delay: number;
    size: number;
  };

  const fireworks: Firework[] = $state([]);
  const balloons: Balloon[] = $state([]);
  const stars: Star[] = $state([]);

  let cakeVisible = $state(false);
  let animationActive = $state(true);
  let zapOpen = $state(false);
  let animationTimer: ReturnType<typeof setTimeout> | null;

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

  function getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  function setAnimationTimer() {
    if (animationTimer) {
      clearTimeout(animationTimer);
    }
    animationTimer = setTimeout(() => {
      if (zapOpen) {
        setAnimationTimer();
      } else {
        endAnimation();
      }
    }, 12000);
  }

  function endAnimation() {
    animationActive = false;
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
  }

  onMount(() => {
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

    for (let i = 0; i < 15; i++) {
      balloons.push({
        id: i,
        left: randomPosition(),
        delay: Math.random() * 5,
        size: 3 + Math.random() * 2,
        color: getRandomItem(balloonColors),
      });
    }

    for (let i = 0; i < 30; i++) {
      stars.push({
        id: i,
        left: randomPosition(),
        top: Math.random() * 10,
        delay: Math.random() * 5,
        size: 0.5 + Math.random() * 1.5,
      });
    }

    setTimeout(() => {
      cakeVisible = true;
    }, 3000);

    setAnimationTimer();
  });
</script>

{#if animationActive}
  <div class="animation-container">
    <div class="background-gradient"></div>

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

    {#each balloons as balloon}
      <div
        class={`balloon ${balloon.color}`}
        style="
          left: {balloon.left}%;
          animation-delay: {balloon.delay}s;
          animation-duration: 6s;
          width: {balloon.size}rem;
          height: {balloon.size * 1.2}rem;
        "
      ></div>
    {/each}

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
    bottom: -10%;
    animation: floatUp 6s ease-in-out infinite;
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
    gap: 1rem;
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
    word-wrap: break-word;
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
    gap: 1rem;
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
      transform: translateY(-120vh);
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