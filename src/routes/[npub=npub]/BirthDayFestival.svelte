<script lang="ts">
  import { onMount } from "svelte";

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
    ];
    return characters[Math.floor(Math.random() * characters.length)];
  }

  onMount(() => {
    for (let i = 0; i < 50; i++) {
      characters.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 5 + Math.random() * 5,
        character: getRandomCharacter(),
      });
    }
  });
</script>

{#each characters as character}
  <div
    class="character"
    style="left: {character.left}%; animation-delay: {character.delay}s; animation-duration: {character.duration}s;"
  >
    {character.character}
  </div>
{/each}

<style>
  .character {
    position: absolute;
    bottom: -100px;
    font-size: 2rem;
    animation: floatUp linear infinite;
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
