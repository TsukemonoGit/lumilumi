<script lang="ts">
  //@ts-ignore
  import { useRegisterSW } from "virtual:pwa-register/svelte";

  // // replaced dynamically
  // const buildDate = __DATE__;

  //https://vite-pwa-org.netlify.app/frameworks/svelte.html#prompt-for-update
  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(swr: any) {
      console.log(`SW registered: ${swr}`);
    },
    onRegisterError(error: any) {
      console.log("SW registration error", error);
    },
  });

  function close() {
    needRefresh.set(false);
  }
  let toast = $derived($needRefresh);
</script>

{#if toast}
  <div class="pwa-toast" role="alert">
    <div class="message">
      {#if $needRefresh}
        <span> New content available, click on reload button to update. </span>
      {/if}
    </div>
    {#if $needRefresh}
      <button onclick={() => updateServiceWorker(true)}> Reload </button>
    {/if}
    <button onclick={close}> Close </button>
  </div>
{/if}

<!-- <div class="pwa-date">
  {buildDate}
</div> -->

<style>
  /* .pwa-date {
    visibility: hidden;
  } */
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
