<script lang="ts">
  import Fes1 from "./Fes1.svelte";
  import Fes2 from "./Fes2.svelte";
  // import Fes3 from "./Fes3.svelte";
  // import Fes4 from "./Fes4.svelte";
  // import Fes5 from "./Fes5.svelte";
  // import Fes6 from "./Fes6.svelte";
  // import Fes7 from "./Fes7.svelte";
  // import Fes8 from "./Fes8.svelte";
  // import Fes9 from "./Fes9.svelte";
  // import Fes10 from "./Fes10.svelte";
  let { metadata } = $props();

  // コンポーネントのリスト
  const festivals = [
    Fes1,
    Fes2, //Fes3, Fes4, Fes5, Fes6, Fes7, Fes8, Fes9, Fes10
  ];

  // ランダムに1つ選択
  const RandomFestival =
    festivals[Math.floor(Math.random() * festivals.length)];
</script>

<div class="fixed top-0 left-0 w-full h-full z-50 pointer-events-none">
  <RandomFestival {metadata} />
</div>
