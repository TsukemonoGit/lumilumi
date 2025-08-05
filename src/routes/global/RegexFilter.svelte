<script lang="ts">
  import { onMount } from "svelte";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";

  let { filter = $bindable() } = $props<{ filter: RegExp | null }>();

  let input = $state("");
  let error = $state("");

  // 起動時に localStorage から読み込み
  onMount(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REGEX_FILTER);
    if (saved) {
      input = saved;
    }
  });

  $effect(() => {
    const raw = input.trim();

    if (raw === "") {
      filter = null;
      error = "";
      localStorage.removeItem(STORAGE_KEYS.REGEX_FILTER); // 空なら削除してもいい
    } else {
      try {
        // /pattern/flags 形式か判定する正規表現
        const match = raw.match(/^\/(.+)\/([a-z]*)$/i);
        if (match) {
          // マッチしたら pattern と flags に分けて RegExp 作成
          const pattern = match[1];
          const flags = match[2];
          filter = new RegExp(pattern, flags);
        } else {
          // リテラル形式でなければそのまま作成
          filter = new RegExp(raw);
        }
        error = "";
        localStorage.setItem(STORAGE_KEYS.REGEX_FILTER, raw); // 正常な正規表現なら保存
      } catch (e) {
        filter = null;
        error = (e as Error).message;
        // エラー時は保存しない（もしくは消す）
      }
    }
  });
</script>

<input
  type="text"
  bind:value={input}
  placeholder="input regex"
  class:error={!!error}
/>
{#if error}
  <p class="error-msg">{error}</p>
{/if}

<style>
  input {
    width: 100%;
  }
  input.error {
    border-color: red;
  }
  .error-msg {
    color: red;
    font-size: 0.9em;
  }
</style>
