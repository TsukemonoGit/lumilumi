<!--GitHub Copilot - Shooting Star Birthday-->
<script lang="ts">
  import { onMount } from "svelte";
  import UserZap from "$lib/components/NostrElements/user/UserZap.svelte";
  import UserPopupMenu from "../NostrElements/user/UserPopupMenu.svelte";
  import UserName from "../NostrElements/user/UserName.svelte";
  import { Zap } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";

  interface ShootingStar {
    id: number;
    startX: number;
    startY: number;
    angle: number;
    delay: number;
    duration: number;
    length: number;
  }

  interface Lantern {
    id: number;
    left: number;
    delay: number;
    duration: number;
    size: number;
    sway: number;
    hue: number;
  }

  interface Sparkle {
    id: number;
    left: number;
    top: number;
    delay: number;
    size: number;
  }

  interface Props {
    metadata: Nostr.Event;
  }

  let { metadata }: Props = $props();

  let shootingStars: ShootingStar[] = $state([]);
  let lanterns: Lantern[] = $state([]);
  let sparkles: Sparkle[] = $state([]);
  let showContent = $state(false);
  let showTitle = $state(false);
  let showZap = $state(false);
  let animationActive = $state(true);
  let containerOpacity = $state(1);
  let zapOpen = $state(false);
  let animationTimer: ReturnType<typeof setTimeout> | null = null;
  let fadeTimer: ReturnType<typeof setTimeout> | null = null;

  // Ring particles for avatar
  const ringParticleCount = 24;
  const ringParticles = Array.from({ length: ringParticleCount }, (_, i) => ({
    angle: (360 / ringParticleCount) * i,
    delay: i * 0.08,
    size: 3 + Math.random() * 3,
  }));

  // アニメーションタイマーをセットする関数
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
    }, 14000);
  }

  function endAnimation() {
    if (fadeTimer) return; // 二重呼び出し防止
    containerOpacity = 0;
    fadeTimer = setTimeout(() => {
      animationActive = false;
      fadeTimer = null;
    }, 1200);
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
  }

  onMount(() => {
    // 流れ星を生成
    shootingStars = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      startX: Math.random() * 120 - 10,
      startY: Math.random() * 40,
      angle: 25 + Math.random() * 20,
      delay: Math.random() * 8,
      duration: 0.8 + Math.random() * 1.2,
      length: 80 + Math.random() * 120,
    }));

    // ランタンを生成
    lanterns = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 6,
      duration: 10 + Math.random() * 8,
      size: 1.2 + Math.random() * 1.0,
      sway: 15 + Math.random() * 30,
      hue: 20 + Math.random() * 40,
    }));

    // キラキラ粒子を生成
    sparkles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 6,
      size: 2 + Math.random() * 3,
    }));

    // 段階的にコンテンツを表示
    const t1 = setTimeout(() => {
      showContent = true;
    }, 800);
    const t2 = setTimeout(() => {
      showTitle = true;
    }, 1800);
    const t3 = setTimeout(() => {
      showZap = true;
    }, 2800);

    setAnimationTimer();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (animationTimer) clearTimeout(animationTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  });
</script>

{#if animationActive}
  <div
    class="fes6-container"
    style="opacity: {containerOpacity}; transition: opacity 1.2s ease-out;"
  >
    <!-- 夜空の背景 -->
    <div class="fes6-sky">
      <!-- オーロラ効果 -->
      <div class="fes6-aurora fes6-aurora-1"></div>
      <div class="fes6-aurora fes6-aurora-2"></div>
      <div class="fes6-aurora fes6-aurora-3"></div>
    </div>

    <!-- キラキラ粒子（星空） -->
    {#each sparkles as sparkle}
      <div
        class="fes6-sparkle"
        style="
          left: {sparkle.left}%;
          top: {sparkle.top}%;
          animation-delay: {sparkle.delay}s;
          width: {sparkle.size}px;
          height: {sparkle.size}px;
        "
      ></div>
    {/each}

    <!-- 流れ星 -->
    {#each shootingStars as star}
      <div
        class="fes6-shooting-star"
        style="
          left: {star.startX}%;
          top: {star.startY}%;
          --star-angle: {star.angle}deg;
          --star-length: {star.length}px;
          animation-delay: {star.delay}s;
          animation-duration: {star.duration}s;
        "
      ></div>
    {/each}

    <!-- 浮かぶランタン -->
    {#each lanterns as lantern}
      <div
        class="fes6-lantern"
        style="
          left: {lantern.left}%;
          --sway: {lantern.sway}px;
          animation-delay: {lantern.delay}s;
          animation-duration: {lantern.duration}s;
          font-size: {lantern.size}rem;
          filter: drop-shadow(0 0 8px hsla({lantern.hue}, 100%, 70%, 0.8));
        "
      >
        <div class="fes6-lantern-body" style="--hue: {lantern.hue};">🏮</div>
      </div>
    {/each}

    <!-- メインコンテンツ -->
    <div class="fes6-main-content">
      {#if showContent}
        <!-- アバターリング -->
        <div class="fes6-avatar-section">
          <!-- 回転するゴールドリング -->
          <div class="fes6-ring">
            {#each ringParticles as particle}
              <div
                class="fes6-ring-particle"
                style="
                  --angle: {particle.angle}deg;
                  animation-delay: {particle.delay}s;
                  width: {particle.size}px;
                  height: {particle.size}px;
                "
              ></div>
            {/each}
          </div>

          <!-- ユーザーアバター -->
          <div class="fes6-avatar">
            <UserPopupMenu
              pubkey={metadata.pubkey}
              size={88}
              {metadata}
              displayMenu={false}
              depth={0}
            />
          </div>
        </div>

        <!-- ユーザーネーム -->
        <div class="fes6-username">
          <UserName pubhex={metadata.pubkey} />
        </div>
      {/if}

      {#if showTitle}
        <!-- Happy Birthday テキスト -->
        <div class="fes6-title-container">
          <div class="fes6-title">
            <span class="fes6-title-deco">✦</span>
            <span class="fes6-title-text">Happy Birthday</span>
            <span class="fes6-title-deco">✦</span>
          </div>
          <div class="fes6-subtitle">
            🎂 Wishing you a wonderful year ahead 🎂
          </div>
        </div>
      {/if}

      {#if showZap}
        <!-- Zapボタン -->
        <div class="fes6-zap-section">
          <UserZap {metadata} bind:zapOpen comment="Happy Birthday🎉">
            <button class="fes6-zap-button">
              <span class="fes6-zap-glow"></span>
              <span class="fes6-zap-inner">
                <Zap class="fes6-zap-icon" size="1.4rem" />
                <span>Send Birthday Zap</span>
              </span>
            </button>
          </UserZap>
        </div>
      {/if}
    </div>

    <!-- 閉じるボタン -->
    <button class="fes6-close" onclick={endAnimation}>✕</button>
  </div>
{/if}

<style>
  /* === コンテナ === */
  .fes6-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    overflow: hidden;
    pointer-events: auto;
  }

  /* === 夜空背景 === */
  .fes6-sky {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at 50% 0%,
      #0c1445 0%,
      #030712 60%,
      #000000 100%
    );
    z-index: 0;
  }

  /* === オーロラ === */
  .fes6-aurora {
    position: absolute;
    width: 200%;
    height: 50%;
    opacity: 0.25;
    filter: blur(60px);
    animation: fes6-aurora-drift 12s ease-in-out infinite alternate;
  }

  .fes6-aurora-1 {
    top: -10%;
    left: -50%;
    background: linear-gradient(
      135deg,
      transparent 20%,
      rgba(139, 92, 246, 0.5) 35%,
      rgba(59, 130, 246, 0.4) 50%,
      transparent 65%
    );
    animation-duration: 14s;
  }

  .fes6-aurora-2 {
    top: -5%;
    left: -30%;
    background: linear-gradient(
      160deg,
      transparent 25%,
      rgba(236, 72, 153, 0.4) 40%,
      rgba(168, 85, 247, 0.3) 55%,
      transparent 70%
    );
    animation-duration: 10s;
    animation-delay: 2s;
  }

  .fes6-aurora-3 {
    top: -15%;
    left: -20%;
    background: linear-gradient(
      120deg,
      transparent 30%,
      rgba(34, 211, 238, 0.3) 45%,
      rgba(56, 189, 248, 0.2) 55%,
      transparent 65%
    );
    animation-duration: 16s;
    animation-delay: 4s;
  }

  @keyframes fes6-aurora-drift {
    from {
      transform: translateX(-10%) rotate(-2deg);
    }
    to {
      transform: translateX(10%) rotate(2deg);
    }
  }

  /* === キラキラ === */
  .fes6-sparkle {
    position: absolute;
    background: white;
    border-radius: 50%;
    pointer-events: none;
    z-index: 1;
    animation: fes6-twinkle 3s ease-in-out infinite;
  }

  @keyframes fes6-twinkle {
    0%,
    100% {
      opacity: 0.1;
      transform: scale(0.5);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* === 流れ星 === */
  .fes6-shooting-star {
    position: absolute;
    width: var(--star-length);
    height: 2px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0.8) 80%,
      white
    );
    border-radius: 1px;
    transform: rotate(var(--star-angle));
    pointer-events: none;
    z-index: 2;
    opacity: 0;
    animation: fes6-shoot linear infinite;
    filter: drop-shadow(0 0 4px rgba(200, 200, 255, 0.8));
  }

  .fes6-shooting-star::after {
    content: "";
    position: absolute;
    right: 0;
    top: -2px;
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 0 12px 4px rgba(200, 220, 255, 0.9);
  }

  @keyframes fes6-shoot {
    0% {
      opacity: 0;
      transform: rotate(var(--star-angle)) translateX(0);
    }
    5% {
      opacity: 1;
    }
    60% {
      opacity: 1;
    }
    80% {
      opacity: 0;
      transform: rotate(var(--star-angle)) translateX(-400px);
    }
    100% {
      opacity: 0;
      transform: rotate(var(--star-angle)) translateX(-400px);
    }
  }

  /* === ランタン === */
  .fes6-lantern {
    position: absolute;
    bottom: -15%;
    pointer-events: none;
    z-index: 3;
    animation: fes6-float-up linear infinite;
  }

  .fes6-lantern-body {
    animation: fes6-sway 3s ease-in-out infinite alternate;
  }

  @keyframes fes6-float-up {
    0% {
      transform: translateY(0);
      opacity: 0;
    }
    5% {
      opacity: 0.9;
    }
    85% {
      opacity: 0.9;
    }
    100% {
      transform: translateY(-120vh);
      opacity: 0;
    }
  }

  @keyframes fes6-sway {
    from {
      transform: translateX(calc(var(--sway) * -1));
    }
    to {
      transform: translateX(var(--sway));
    }
  }

  /* === メインコンテンツ === */
  .fes6-main-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -52%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    z-index: 10;
    pointer-events: none;
    max-height: 95vh;
  }

  /* === アバターセクション === */
  .fes6-avatar-section {
    position: relative;
    width: 140px;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fes6-content-appear 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .fes6-avatar {
    position: relative;
    z-index: 2;
    border-radius: 50%;
    overflow: hidden;
    box-shadow:
      0 0 30px rgba(251, 191, 36, 0.4),
      0 0 60px rgba(251, 191, 36, 0.2);
    animation: fes6-avatar-glow 3s ease-in-out infinite alternate;
  }

  @keyframes fes6-avatar-glow {
    from {
      box-shadow:
        0 0 30px rgba(251, 191, 36, 0.4),
        0 0 60px rgba(251, 191, 36, 0.2);
    }
    to {
      box-shadow:
        0 0 40px rgba(251, 191, 36, 0.6),
        0 0 80px rgba(251, 191, 36, 0.3),
        0 0 120px rgba(251, 191, 36, 0.1);
    }
  }

  /* === 回転リング === */
  .fes6-ring {
    position: absolute;
    width: 140px;
    height: 140px;
    animation: fes6-ring-spin 20s linear infinite;
    z-index: 1;
  }

  .fes6-ring-particle {
    position: absolute;
    top: 50%;
    left: 50%;
    background: radial-gradient(circle, #fbbf24, #f59e0b);
    border-radius: 50%;
    transform: rotate(var(--angle)) translateX(68px)
      rotate(calc(var(--angle) * -1));
    box-shadow: 0 0 6px rgba(251, 191, 36, 0.8);
    animation: fes6-particle-pulse 2s ease-in-out infinite;
  }

  @keyframes fes6-ring-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes fes6-particle-pulse {
    0%,
    100% {
      opacity: 0.4;
      transform: rotate(var(--angle)) translateX(68px)
        rotate(calc(var(--angle) * -1)) scale(0.6);
    }
    50% {
      opacity: 1;
      transform: rotate(var(--angle)) translateX(68px)
        rotate(calc(var(--angle) * -1)) scale(1.2);
    }
  }

  /* === ユーザーネーム === */
  .fes6-username {
    font-size: 1.3rem;
    font-weight: 700;
    color: #fde68a;
    text-shadow:
      0 0 10px rgba(253, 230, 138, 0.6),
      0 0 30px rgba(251, 191, 36, 0.3);
    animation: fes6-content-appear 0.8s ease-out forwards;
    animation-delay: 0.3s;
    opacity: 0;
    text-align: center;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* === タイトル === */
  .fes6-title-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    animation: fes6-content-appear 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .fes6-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .fes6-title-text {
    font-size: 2.2rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    background: linear-gradient(
      135deg,
      #fde68a 0%,
      #fbbf24 25%,
      #f9a8d4 50%,
      #c084fc 75%,
      #fde68a 100%
    );
    background-size: 200% 200%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: fes6-shimmer 3s ease-in-out infinite;
    filter: drop-shadow(0 2px 8px rgba(251, 191, 36, 0.4));
    padding-bottom: 0.15em;
    line-height: 1.3;
  }

  .fes6-title-deco {
    color: #fbbf24;
    font-size: 1.4rem;
    animation: fes6-sparkle-deco 2s ease-in-out infinite;
    filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.6));
  }

  @keyframes fes6-shimmer {
    0%,
    100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  @keyframes fes6-sparkle-deco {
    0%,
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.3) rotate(180deg);
      opacity: 1;
    }
  }

  .fes6-subtitle {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.05em;
    animation: fes6-content-appear 0.8s ease-out forwards;
    animation-delay: 0.5s;
    opacity: 0;
  }

  /* === Zapボタン === */
  .fes6-zap-section {
    margin-top: 0.5rem;
    pointer-events: auto;
    animation: fes6-content-appear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)
      forwards;
  }

  .fes6-zap-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    overflow: hidden;
    background: transparent;
    transition: transform 0.2s ease;
  }

  .fes6-zap-button:hover {
    transform: scale(1.08);
  }

  .fes6-zap-button:active {
    transform: scale(0.95);
  }

  .fes6-zap-glow {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: linear-gradient(
      135deg,
      #f59e0b,
      #ef4444,
      #ec4899,
      #8b5cf6,
      #f59e0b
    );
    background-size: 300% 300%;
    animation: fes6-glow-rotate 3s linear infinite;
    opacity: 0.9;
  }

  .fes6-zap-glow::before {
    content: "";
    position: absolute;
    inset: 2px;
    border-radius: 9999px;
    background: rgba(0, 0, 0, 0.7);
  }

  .fes6-zap-inner {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #fde68a;
    font-weight: 700;
    font-size: 1rem;
    text-shadow: 0 0 12px rgba(251, 191, 36, 0.5);
  }

  .fes6-zap-inner :global(.fes6-zap-icon) {
    stroke: #fbbf24;
    fill: #fbbf24;
    filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.8));
    animation: fes6-zap-pulse 1.5s ease-in-out infinite;
  }

  @keyframes fes6-glow-rotate {
    0% {
      background-position: 0% 50%;
    }
    100% {
      background-position: 300% 50%;
    }
  }

  @keyframes fes6-zap-pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
  }

  /* === コンテンツ表示アニメーション === */
  @keyframes fes6-content-appear {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* === 閉じるボタン === */
  .fes6-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    cursor: pointer;
    z-index: 50;
    backdrop-filter: blur(4px);
    transition: all 0.2s ease;
  }

  .fes6-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-color: rgba(255, 255, 255, 0.4);
  }

  /* === レスポンシブ === */
  @media (max-width: 480px) {
    .fes6-title-text {
      font-size: 1.6rem;
    }

    .fes6-avatar-section {
      width: 110px;
      height: 110px;
    }

    .fes6-ring {
      width: 110px;
      height: 110px;
    }

    .fes6-ring-particle {
      transform: rotate(var(--angle)) translateX(52px)
        rotate(calc(var(--angle) * -1));
    }

    @keyframes fes6-particle-pulse {
      0%,
      100% {
        opacity: 0.4;
        transform: rotate(var(--angle)) translateX(52px)
          rotate(calc(var(--angle) * -1)) scale(0.6);
      }
      50% {
        opacity: 1;
        transform: rotate(var(--angle)) translateX(52px)
          rotate(calc(var(--angle) * -1)) scale(1.2);
      }
    }
  }
</style>
