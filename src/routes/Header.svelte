<script lang="ts">
  import { run } from "svelte/legacy";

  import RelayStatus from "$lib/components/RelayStatus.svelte";
  import { SlidersHorizontal } from "lucide-svelte";
  import { currentPage } from "./menu";
  import Popover from "$lib/components/Elements/Popover.svelte";
  import { createRadioGroup, melt } from "@melt-ui/svelte";
  import { _ } from "svelte-i18n";
  import { showBanner, timelineFilter } from "$lib/stores/stores";
  import { writable } from "svelte/store";
  import { page } from "$app/stores";

  let openPopover: any = $state();
  const optionsArr = [
    ["0", $_("filter.canversation.all")],
    ["1", $_("filter.canversation.onlyFollowee")],
    ["2", $_("filter.canversation.none")],
  ];
  const selected = writable<string>(
    optionsArr[$timelineFilter.selectCanversation][0]
  );

  const {
    elements: { root, item, hiddenInput },
    helpers: { isChecked },
  } = createRadioGroup({
    defaultValue: optionsArr[$timelineFilter.selectCanversation][0],
    value: selected,
  });
  // $: console.log($timelineFilter.adaptMute);
  selected.subscribe((value) => {
    if (value !== undefined && value !== null) {
      $timelineFilter.selectCanversation = Number(value);
    }
  });
  timelineFilter.subscribe((value) => {
    if (value) {
      localStorage.setItem("timelineFilter", JSON.stringify(value));
    }
  });
  showBanner.subscribe((value) => {
    if (value !== undefined && value !== null) {
      localStorage.setItem("showBanner", value.toString());
    }
  });
</script>

<header>
  <div class="fixed top-0 w-full z-50 h-8 backdrop-blur bg-neutral-900/50">
    <div class="flex w-full h-8 justify-center items-center gap-4">
      {#if $currentPage?.Icon}
        {@const SvelteComponent = $currentPage.Icon}
        <div>
          <SvelteComponent />
        </div>
      {/if}
      <div class="uppercase font-bold">
        {$currentPage?.alt ??
          ($page.route.id === "/post" ? "share" : "lumilumi")}
      </div>
      <RelayStatus />
    </div>
    {#if $currentPage?.alt !== "settings"}<!--&& $currentPage?.alt !== "about"-->
      <div class="fixed w-full top-0">
        <div class="container relative">
          <div class="option">
            <Popover
              open={openPopover}
              ariaLabel="timeline filter setting"
              showCloseButton={true}
            >
              <div
                class=" flex items-center font-bold text-sm gap-1 rounded-full border text-magnum-200 border-magnum-300
                hover:bg-magnum-800/25 active:bg-magnum-700/25 px-3 py-1"
              >
                <SlidersHorizontal size={16} />Options
              </div>
              {#snippet popoverContent()}
                <div class="w-[320px] max-w-full flex flex-col">
                  <ul>
                    {#if $currentPage?.alt === "home"}
                      <li class="mb-2">
                        <div class="label">
                          {$_("filter.menu.canversation")}
                        </div>
                        <div
                          use:melt={$root}
                          class="text-sm my-1 gap-1 flex flex-col data-[orientation=horizontal]:flex-row"
                          aria-label="View density"
                        >
                          {#each optionsArr as [index, option]}
                            <div class="flex items-center gap-3">
                              <button
                                use:melt={$item(index)}
                                class="grid h-6 w-6 cursor-default place-items-center rounded-full border border-magnum-400 shadow-sm
        hover:bg-magnum-800"
                                id={option}
                                aria-labelledby="{option}-label"
                              >
                                {#if $isChecked(index)}
                                  <div
                                    class="h-3 w-3 rounded-full bg-magnum-400"
                                  ></div>
                                {/if}
                              </button>
                              <label for={option} id="{option}-label">
                                {option}
                              </label>
                            </div>
                          {/each}
                          <input name="line-height" use:melt={$hiddenInput} />
                        </div>
                      </li>
                    {/if}
                    <li>
                      <label class="label">
                        <input
                          type="checkbox"
                          class="rounded-checkbox"
                          bind:checked={$timelineFilter.adaptMute}
                        />
                        {$_("filter.menu.muteOn")}
                      </label>
                    </li>
                    <li>
                      <label class="label">
                        <input
                          type="checkbox"
                          class="rounded-checkbox"
                          bind:checked={$showBanner}
                        />
                        {$_("settings.display.banner")}
                      </label>
                    </li>
                  </ul>
                </div>
              {/snippet}</Popover
            >
          </div>
        </div>
      </div>{/if}
  </div>
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
