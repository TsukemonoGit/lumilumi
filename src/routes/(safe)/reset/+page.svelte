<script lang="ts">
  import { browser } from "$app/environment";
  import { t } from "@konemono/svelte5-i18n";

  type ResetOption = {
    key: string;
    description: string;
    relatedKeys?: string[];
  };
  let refreshTrigger = $state(0);
  let resetOptions: ResetOption[] = $derived.by(() => {
    refreshTrigger;
    if (!browser) return [];
    const storageKeys = Object.keys(localStorage);

    return [
      // 優先：壊れたときの修復に影響しやすい設定
      {
        key: "timelineFilter",
        description: $t("reset.options.timelineFilter"),
      },
      {
        key: "lumiSetting",
        description: $t("reset.options.lumiSetting"),
      },

      // それ以外の構成データ・記録など
      {
        key: "kind3",
        description: $t("reset.options.kind3"),
      },
      {
        key: "metadata",
        description: $t("reset.options.metadata"),
      },
      {
        key: "lumiEmoji",
        description: $t("reset.options.lumiEmoji"),
      },
      {
        key: "lumiMute",
        description: $t("reset.options.lumiMute"),
      },
      {
        key: "lumiMuteByKind",
        description: $t("reset.options.lumiMuteByKind"),
      },
      {
        key: "kind10003",
        description: $t("reset.options.kind10003"),
      },
      {
        key: "nostrLoginAll",
        description: $t("reset.options.nostrLoginAll"),
        relatedKeys: [
          "__nostrlogin_accounts",
          "__nostrlogin_nip46",
          "__nostrlogin_recent",
        ],
      },
    ].filter((option) => {
      if (option.key === "kind3") {
        return storageKeys.some((k) => k.startsWith("kind3-"));
      } else if (option.relatedKeys) {
        return option.relatedKeys.some((rk) => storageKeys.includes(rk));
      } else {
        return storageKeys.includes(option.key);
      }
    });
  });

  let selected: string[] = $state([]);

  function removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`削除失敗: ${key}`, error);
    }
  }

  function getKeysToDelete(selectedKeys: string[]): string[] {
    const keysToDelete: string[] = [];

    for (const key of selectedKeys) {
      const option = resetOptions.find((opt) => opt.key === key);

      if (key === "kind3") {
        // kind3-で始まるキーを動的に取得
        const storageKeys = Object.keys(localStorage);
        const kind3Keys = storageKeys.filter((storageKey) =>
          storageKey.startsWith("kind3-")
        );
        keysToDelete.push(...kind3Keys);
      } else if (option?.relatedKeys) {
        keysToDelete.push(...option.relatedKeys);
      } else {
        keysToDelete.push(key);
      }
    }

    return keysToDelete;
  }

  function resetSelected(selectedKeys: string[]): void {
    if (selectedKeys.length === 0) return;

    const keysToDelete = getKeysToDelete(selectedKeys);
    keysToDelete.forEach(removeItem);

    alert($t("reset.deleteSuccess"));

    // UI再更新のためトリガー増加
    refreshTrigger += 1;

    // 選択解除（削除されたので）
    deselectAll();
  }
  function selectAll(): void {
    selected = resetOptions.map((option) => option.key);
  }

  function deselectAll(): void {
    selected = [];
  }
</script>

<h1 class="text-xl font-bold mb-4">{$t("reset.title")}</h1>

<div class="mb-6 p-4 bg-magnum-950 border border-magnum-800 rounded-lg">
  <h2 class="text-lg font-semibold text-magnum-200">
    {$t("reset.notice.title")}
  </h2>
  <p class="text-magnum-300 !my-0">
    {$t("reset.notice.description")}
  </p>
</div>

<p class="mb-4">
  {$t("reset.description")}
</p>

<ul class="space-y-2 mb-4">
  {#each resetOptions as option}
    <li class="flex items-center space-x-2">
      <input
        type="checkbox"
        bind:group={selected}
        value={option.key}
        id={option.key}
      />
      <label for={option.key}>{option.description}</label>
    </li>
  {/each}
</ul>

<div class="flex gap-4">
  <button
    class="px-4 py-2 bg-magnum-600 rounded hover:bg-magnum-700 disabled:opacity-50 disabled:cursor-not-allowed"
    onclick={() => resetSelected(selected)}
    disabled={selected.length === 0}
  >
    {$t("reset.buttons.deleteSelected")}
  </button>

  <button
    class="px-4 py-2 bg-neutral-700 rounded hover:bg-neutral-800"
    onclick={selectAll}
  >
    {$t("reset.buttons.selectAll")}
  </button>

  <button
    class="px-4 py-2 bg-neutral-700 rounded hover:bg-neutral-800"
    onclick={deselectAll}
  >
    {$t("reset.buttons.deselectAll")}
  </button>
</div>
