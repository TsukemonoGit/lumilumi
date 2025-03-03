<script lang="ts">
  import UserZap from "$lib/components/NostrElements/user/UserZap.svelte";
  import { onMount } from "svelte";

  let { metadata } = $props();
  let characters: any[] = $state([]);

  function getRandomCharacter() {
    const characters = [
      "🐱",
      "🐶",
      "🐰",
      "🐼",
      "🦊",
      "🐻",
      "🎉",
      "🎂",
      "🎁",
      "🎈",
      "🍰",
      "🍾",
      "⚡️",
    ];
    return characters[Math.floor(Math.random() * characters.length)];
  }

  onMount(() => {
    for (let i = 0; i < 20; i++) {
      // 数を50から20に減らします
      characters.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 10,
        character: getRandomCharacter(),
        size: 1 + Math.random() * 2, // サイズをランダムに設定
      });
    }
  });
</script>

{#each characters as character}
  {#if character.character == "⚡️"}
    <div
      class="character"
      style="left: {character.left}%; animation-delay: {character.delay}s; animation-duration: {character.duration}s;font-size: {character.size}rem; pointer-events: auto;"
    >
      <UserZap {metadata} />
    </div>{:else}<div
      class="character"
      style="left: {character.left}%; animation-delay: {character.delay}s; animation-duration: {character.duration}s;"
    >
      {character.character}
    </div>
  {/if}
{/each}

<style>
  .character {
    position: absolute;
    bottom: -100px;
    font-size: 2rem;
    animation: floatUp linear infinite;
    min-width: 2rem;
  }

  @keyframes floatUp {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(-110vh);
    }
  }
</style>
