<script lang="ts">
  import RelayStatus from "$lib/components/RelayStatus.svelte";
  import { SlidersHorizontal } from "lucide-svelte";

  import Popover from "$lib/components/Elements/Popover.svelte";

  import { t as _ } from "@konemono/svelte5-i18n";

  import { page } from "$app/state";
  import { showBanner, timelineFilter } from "$lib/stores/globalRunes.svelte";
  import { untrack } from "svelte";
  import { mainMenuItems } from "./menu";
  import HomeOptions from "./HomeOptions.svelte";
  import GlobalOptions from "./GlobalOptions.svelte";

  let _showBanner: boolean = $state(showBanner.get());

  //-----
  // 現在のページに基づいてアイコンを設定
  let currentPage = $derived.by(() => {
    const { pathname } = page.url;
    // アイテムを部分一致でチェック
    const matchedItem = mainMenuItems.find((item) => {
      if (item.link === "/" && pathname === "/") return true;

      if (item.link !== "/" && item.link && pathname.startsWith(item.link))
        return true;

      return false;
    });

    return matchedItem || null;
  });

  $effect(() => {
    if (_showBanner !== undefined && _showBanner !== null) {
      //console.log(_showBanner);
      untrack(() => {
        showBanner.set(_showBanner);
        localStorage.setItem("showBanner", showBanner.get().toString());
      });
    }
  });
  // $inspect(_showBanner);
  let Icon = $derived(currentPage?.Icon);
  const onMuteChange = () => {
    timelineFilter.update((cur) => {
      console.log(cur);
      const tlFilter = { ...cur, adaptMute: !cur.adaptMute };
      localStorage.setItem("timelineFilter", JSON.stringify(tlFilter));
      return tlFilter;
    });
  };
</script>

<header class="fixed top-0 w-full z-50 h-8 backdrop-blur bg-neutral-900/50">
  <div class="flex w-full h-8 justify-center items-center gap-4">
    {#if Icon}
      <div>
        <Icon />
      </div>
    {/if}
    <div class="uppercase font-bold">
      {currentPage?.alt ?? (page.route.id === "/post" ? "share" : "lumilumi")}
    </div>
    <RelayStatus />
  </div>
  {#if currentPage?.alt !== "settings"}<!--&& currentPage?.alt !== "about"-->
    <div class="fixed w-full top-0">
      <div class="container relative">
        <div class="option">
          <Popover ariaLabel="timeline filter setting" showCloseButton={true}>
            <div
              class=" flex items-center font-bold text-sm gap-1 rounded-full border text-magnum-200 border-magnum-300
                hover:bg-magnum-800/25 active:bg-magnum-700/25 px-3 py-1"
            >
              <SlidersHorizontal size={16} />Options
            </div>
            {#snippet popoverContent()}
              <ul class="w-[320px] max-w-full flex flex-col">
                {#if currentPage?.alt === "home"}
                  <HomeOptions />
                {:else if currentPage?.alt === "global"}
                  <GlobalOptions />
                {/if}
                <li>
                  <label class="label">
                    <input
                      type="checkbox"
                      class="rounded-checkbox"
                      checked={timelineFilter.get().adaptMute}
                      onchange={onMuteChange}
                    />
                    {$_("filter.menu.muteOn")}
                  </label>
                </li>
                <li>
                  <label class="label">
                    <input
                      type="checkbox"
                      class="rounded-checkbox"
                      bind:checked={_showBanner}
                    />
                    {$_("settings.display.banner")}
                  </label>
                </li>
              </ul>
            {/snippet}</Popover
          >
        </div>
      </div>
    </div>{/if}
</header>

<style lang="postcss">
  header {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
  ul {
    list-style-type: disc; /* デフォルトのリストアイコン */

    padding-left: 1.5em; /* パディングを追加してアイコンとテキストの距離を調整 */
  }
  li {
    padding-top: 4px;
  }
  .label {
    list-style-type: disc;
    display: flex;
    align-items: flex-start;
    gap: 0.5em;
  }

  .option {
    @apply absolute top-0 h-8 flex  right-8;
  }

  @media (max-width: 768px) {
    .option {
      @apply absolute top-0 h-8 flex right-0;
    }
  }
</style>
