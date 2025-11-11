<script lang="ts">
  //@ts-ignore
  import { useRegisterSW } from "virtual:pwa-register/svelte";

  // // replaced dynamically
  // const buildDate = __DATE__;

  //https://vite-pwa-org.netlify.app/frameworks/svelte.html#prompt-for-update
  //const { offlineReady, needRefresh, updateServiceWorker } =

  let needRefresh = $state(false);
  const { updateServiceWorker } = useRegisterSW({
    needRefresh: false,
    autoReload: false, // 自動リロードを無効化
    immediate: false, // 手動でチェックを行うように設定
    onRegistered(swr: any) {
      console.log(`SW registered: ${swr}`);
    },
    onRegisterError(error: any) {
      console.log("SW registration error", error);
    },
    onNeedRefresh() {
      needRefresh = true;
    },
  });

  function close() {
    needRefresh = false;
  }

  function handleClickReload() {
    updateServiceWorker(true)
      .then(() => {
        console.log("Service Worker updated successfully");
      })
      .catch((error: any) => {
        console.error("Failed to update Service Worker:", error);
      });
    close();
  }
</script>

{#if needRefresh}
  <div class="pwa-toast" role="alert">
    <div class="message">
      <span> New content available, click on reload button to update. </span>
    </div>

    <button onclick={handleClickReload}> Reload </button>

    <button onclick={close}> Close </button>
  </div>
{/if}

<style>
  .pwa-toast {
    position: fixed;
    right: 0;
    bottom: 0;
    margin: 16px;
    padding: 12px;
    border: 1px solid rgb(var(--color-neutral-400) / 1);
    border-radius: 4px;
    z-index: 2;
    text-align: left;
    box-shadow: 3px 4px 5px 0 rgb(var(--color-neutral-900) / 0.5);
    background-color: rgb(var(--color-neutral-900) / 1);
  }
  @media screen and (max-width: 767px) {
    .pwa-toast {
      bottom: 3rem;
    }
  }
  .pwa-toast .message {
    margin-bottom: 8px;
  }
  .pwa-toast button {
    border: 1px solid rgb(var(--color-neutral-600) / 1);
    outline: none;
    margin-right: 5px;
    border-radius: 2px;
    padding: 3px 10px;
  }
</style>
