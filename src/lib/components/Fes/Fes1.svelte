<!--chatGPT-->
<script lang="ts">
  import UserZap from "$lib/components/NostrElements/user/UserZap.svelte";
  import { Zap } from "lucide-svelte";
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
      "🎈",
      "🎈",
      "🍰",
      "🍾",
      "⚡️",
      "⚡️",
    ];
    return characters[Math.floor(Math.random() * characters.length)];
  }

  onMount(() => {
    for (let i = 0; i < 30; i++) {
      // 数を50から20に減らします
      characters.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 10,
        character: getRandomCharacter(),
        size: 1.5 + Math.random() * 2, // サイズをランダムに設定
      });
    }
  });
</script>

{#each characters as character}
  {#if character.character == "⚡️"}
    <div
      class="character"
      style="left: {character.left}%; animation-delay: {character.delay}s; animation-duration: {character.duration}s; pointer-events: auto;"
    >
      <UserZap {metadata} comment="Happy Birthday🎉"
        ><Zap
          class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 stroke-yellow-400 fill-yellow-400 rounded-full hover:brightness-125   hover:scale-110 active:scale-90 transition duration-150 ease-in-out transform hover:rotate-180 "
          size="{character.size}rem"
        /></UserZap
      >
    </div>{:else}<div
      class="character"
      style="left: {character.left}%; animation-delay: {character.delay}s; animation-duration: {character.duration}s; font-size: {character.size}rem"
    >
      {character.character}
    </div>
  {/if}
{/each}

<style>
  .character {
    position: absolute;
    bottom: -100px;

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
