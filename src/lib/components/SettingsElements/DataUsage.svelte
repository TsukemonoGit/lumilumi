<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";

  import SettingsCard from "./SettingsCard.svelte";
  import type { LumiSetting } from "$lib/types";

  import ImageAutoExpand from "./ImageAutoExpand.svelte";
  import UsageLevel from "./UsageLevel.svelte";

  interface Props {
    settings: LumiSetting;
  }

  let { settings = $bindable() }: Props = $props();

  // ===== 通信量イメージ（ポイントシステム） =====
  // 各設定をONにした場合の通信量への影響度（内部計算用。数値自体はUIに表示しない）
  const usageWeights = {
    showImg: 5,
    showAllReactions: 2,
    kind42inTL: 1,
    showUserStatus: 1,
    showReactioninTL: 1,
    showKind16: 1,
  } as const;

  const maxUsageWeight = Object.values(usageWeights).reduce(
    (sum, w) => sum + w,
    0,
  );

  let checkedUsageWeight = $derived(
    (settings.showImg ? usageWeights.showImg : 0) +
      (settings.showAllReactions ? usageWeights.showAllReactions : 0) +
      (settings.kind42inTL ? usageWeights.kind42inTL : 0) +
      (settings.showUserStatus ? usageWeights.showUserStatus : 0) +
      (settings.showReactioninTL ? usageWeights.showReactioninTL : 0) +
      (settings.showKind16 ? usageWeights.showKind16 : 0),
  );

  let usageRatio = $derived(checkedUsageWeight / maxUsageWeight);
</script>

<SettingsCard title={$_("settings.usage.title")}>
  <div class="flex flex-col gap-4 box-border">
    <div
      class="mb-1 flex items-center gap-2"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={maxUsageWeight}
      aria-valuenow={checkedUsageWeight}
      aria-label={$_("settings.usage.title")}
    >
      <span class="text-xs font-semibold text-green-600">
        {$_("settings.usage.low")}
      </span>

      <div
        class="relative h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200"
      >
        <div
          class="absolute inset-y-0 left-0 rounded-l-full bg-magnum-700"
          style="width: {usageRatio * 100}%"
        ></div>
      </div>

      <span class="text-xs font-semibold text-orange-500">
        {$_("settings.usage.high")}
      </span>
    </div>
    <div>
      <div class="flex items-center justify-between gap-4">
        <label class="flex flex-1 items-center gap-2">
          <input
            type="checkbox"
            class="rounded-checkbox"
            bind:checked={settings.showImg}
          />
          {$_("settings.display.loadImage")}
        </label>

        <UsageLevel amount={usageWeights.showImg} />
      </div>

      {#if settings.showImg}
        <ImageAutoExpand bind:imageAutoExpand={settings.imageAutoExpand} />
        <label class="ml-8 flex gap-2 pt-1">
          <input
            type="checkbox"
            class="rounded-checkbox"
            bind:checked={settings.embed}
          />
          {$_("settings.display.embed")}(youtube, twitter, bluesky)
        </label>
      {/if}
    </div>

    <div class="flex items-center justify-between gap-4">
      <label class="flex flex-1 items-center gap-2">
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showAllReactions}
        />
        {$_("settings.display.showAllReaction")}
      </label>

      <UsageLevel amount={usageWeights.showAllReactions} />
    </div>

    <div class="flex items-center justify-between gap-4">
      <label class="flex flex-1 items-center gap-2">
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.kind42inTL}
        />
        {$_("settings.display.kind42inTL")}
      </label>

      <UsageLevel amount={usageWeights.kind42inTL} />
    </div>

    <div class="flex items-center justify-between gap-4">
      <label class="flex flex-1 items-center gap-2">
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showUserStatus}
        />
        {$_("settings.display.showUserStatus")}
      </label>

      <UsageLevel amount={usageWeights.showUserStatus} />
    </div>

    <div class="flex items-center justify-between gap-4">
      <label class="flex flex-1 items-center gap-2">
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showReactioninTL}
        />
        {$_("settings.display.showReactioninTL")}
      </label>

      <UsageLevel amount={usageWeights.showReactioninTL} />
    </div>

    <div class="flex items-center justify-between gap-4">
      <label class="flex flex-1 items-center gap-2">
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={settings.showKind16}
        />
        {$_("settings.display.showKind16")}
      </label>

      <UsageLevel amount={usageWeights.showKind16} />
    </div>
  </div>
</SettingsCard>
