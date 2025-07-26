<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import { followList, timelineFilter } from "$lib/stores/globalRunes.svelte";

  // 旧設定のマイグレーション処理
  const migrateOldSettings = (current: any) => {
    let migrated = { ...current };

    // 旧バージョンのglobalExcludeFolloweeが存在する場合
    if ("globalExcludeFollowee" in migrated && !migrated.global) {
      migrated.global = {
        excludeFollowee: migrated.globalExcludeFollowee,
        excludeConversation: false,
      };
      delete migrated.globalExcludeFollowee;
    }

    // globalオブジェクトが存在しない場合の初期化
    if (!migrated.global) {
      migrated.global = {
        excludeFollowee: false,
        excludeConversation: false,
      };
    }

    return migrated;
  };

  const onChangeExcludeFollowee = () => {
    timelineFilter.update((cur) => {
      const migrated = migrateOldSettings(cur);
      const tlFilter = {
        ...migrated,
        global: {
          ...migrated.global,
          excludeFollowee: !migrated.global.excludeFollowee,
        },
      };
      localStorage.setItem("timelineFilter", JSON.stringify(tlFilter));
      return tlFilter;
    });
  };

  const onChangeExcludeConversation = () => {
    timelineFilter.update((cur) => {
      const migrated = migrateOldSettings(cur);
      const tlFilter = {
        ...migrated,
        global: {
          ...migrated.global,
          excludeConversation: !migrated.global.excludeConversation,
        },
      };
      localStorage.setItem("timelineFilter", JSON.stringify(tlFilter));
      return tlFilter;
    });
  };

  // 現在の設定を取得（マイグレーション処理を含む）
  let currentFilter = $derived(migrateOldSettings(timelineFilter.get()));
</script>

<li class="mb-2">
  <label class="label">
    <input
      type="checkbox"
      class="rounded-checkbox"
      checked={currentFilter.global?.excludeConversation || false}
      onchange={onChangeExcludeConversation}
    />
    {$_("filter.canversation.none")}
  </label>
</li>
{#if followList.get() !== undefined && followList.get().size > 0}
  <li class="mb-2">
    <label class="label">
      <input
        type="checkbox"
        class="rounded-checkbox"
        checked={currentFilter.global?.excludeFollowee || false}
        onchange={onChangeExcludeFollowee}
      />
      {$_("filter.menu.globalExcludeFollowee")}
    </label>
  </li>
{/if}
