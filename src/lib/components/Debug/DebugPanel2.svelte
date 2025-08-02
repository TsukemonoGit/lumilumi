<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { debug } from "./debug";

  let erudaInstance: any;

  function setErudaVisibility(show: boolean) {
    const container = document.querySelector("#eruda");
    if (container instanceof HTMLElement) {
      container.style.display = show ? "block" : "none";
    }
  }

  onMount(async () => {
    const eruda = await import("eruda");
    erudaInstance = eruda.default.init();

    // 初期状態でErudaを非表示にする場合
    if (!$debug) {
      setErudaVisibility(false);
    }
  });

  // $debug の変化を監視して表示切替
  $effect(() => {
    const debugValue = $debug; // $debugの値を取得（リアクティブ）

    untrack(() => {
      setErudaVisibility(debugValue); // DOM操作のみuntrackで囲む
    });
  });
</script>
