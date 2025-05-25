<script>
  import { X } from "lucide-svelte";
  import { t as _ } from '@konemono/svelte5-i18n';

  const newDomain = "https://lumilumi.app"; // 新ドメインのURL
  let view = $state(true);
  const handleClickClose = () => {
    view = false;
  };
  const handleClickOpen = () => {
    view = true;
  };
</script>

{#if !view}
  <!---->

  <div class="container">
    <button
      class="fixed top-0 z-50 font-bold text-sm gap-1 rounded-full border text-neutral-200 border-neutral-300
                hover:bg-neutral-800/25 active:bg-neutral-700/25 px-3 py-1"
      onclick={handleClickOpen}
    >
      view info
    </button>
  </div>
{:else}
  <div class="migration-notice">
    <button
      class="absolute top-0 right-0 rounded-full p-1 m-1 text-magnum-800 bg-magnum-100
                hover:bg-magnum-100 focus:shadow-magnum-400"
      onclick={handleClickClose}><X /></button
    >
    <div class="flex flex-col gap-2 items-center notice-content">
      <div>
        <h2>{$_("domainnotice.title")}</h2>
        <div class="mb-4"><strong>https://lumilumi.app</strong></div>
        <p>{$_("domainnotice.message.0")}</p>

        <p>{$_("domainnotice.message.1")}</p>
        <p>{$_("domainnotice.message.2")}</p>
      </div>

      <a href={newDomain} class="button">{$_("domainnotice.movebutton")}</a>
    </div>
  </div>
{/if}

<style lang="postcss">
  .migration-notice {
    position: fixed;
    bottom: 5em;
    left: 50%;
    transform: translateX(-50%);

    padding: 20px;

    border-radius: 8px;
    max-width: 90vw;
    width: 520px;
    text-align: center;
    @apply bg-neutral-800 border border-neutral-300;
  }

  .notice-content h2 {
    font-size: 1.2rem;
    margin-bottom: 4px;
  }

  .notice-content p {
    @apply text-sm;
    margin-bottom: 15px;
    text-align: left;
    text-indent: 1em;
    height: fit-content;
  }

  .button {
    width: fit-content;
    background-color: #0277bd;
    color: white;
    padding: 10px 20px;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
  }

  .button:hover {
    background-color: #01579b;
  }
</style>
