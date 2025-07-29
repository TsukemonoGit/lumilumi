<script lang="ts">
  import { useRepReactionList } from "$lib/stores/useRepReactionList";

  import type Nostr from "nostr-typedef";

  import { changeEmit } from "$lib/func/reactions";
  import { untrack } from "svelte";
  import { lumiSetting, viewEventIds } from "$lib/stores/globalRunes.svelte";

  let filters: Nostr.Filter[] = [];
  let result: { data: any; status: any; error: any };

  // let lastUpdateTimestamp = Date.now() + 3000; // 初回は余裕を持たせる
  const updateInterval = 1000; // 1秒（ミリ秒）
  let timeoutId: NodeJS.Timeout | undefined = undefined;
  let updating = false;

  let etagList: string[] = $state([]);
  let atagList: string[] = $state([]);

  viewEventIds.subscribe((value) => {
    etagList = Array.from(
      new Set(value.filter((tag) => tag[0] === "e").map((tag) => tag[1]))
    );

    atagList = Array.from(
      new Set(
        viewEventIds
          .get()
          .filter((tag) => tag[0] === "a")
          .map((tag) => tag[1])
      )
    );

    debounceUpdate();
  });

  $effect(() => {
    if (etagList || atagList) {
      untrack(() => debounceUpdate());
    }
  });

  function debounceUpdate() {
    if (updating) {
      clearTimeout(timeoutId); // 前のタイマーをクリアして最後の1回だけ実行
    }

    timeoutId = setTimeout(() => {
      performUpdate();
      console.log(etagList.length, atagList.length);
      updating = false;
    }, updateInterval);

    updating = true;
  }

  function performUpdate() {
    if (
      (etagList.length <= 0 && atagList.length <= 0) ||
      !lumiSetting.get().pubkey
    )
      return;

    filters =
      etagList.length > 0
        ? [
            {
              "#e": $state.snapshot(etagList),
              authors: lumiSetting.get().showAllReactions
                ? undefined
                : [lumiSetting.get().pubkey],
              kinds: [7, 6, 16],
            },
            {
              "#e": $state.snapshot(etagList),
              kinds: [9735],
            },
          ]
        : [];
    if (atagList.length > 0) {
      filters.push(
        {
          "#a": $state.snapshot(atagList),
          authors: lumiSetting.get().showAllReactions
            ? undefined
            : [lumiSetting.get().pubkey],
          kinds: [7, 6, 16],
        },
        {
          "#a": $state.snapshot(atagList),
          kinds: [9735],
        }
      );
    }
    changeEmit(filters);

    //実行されたらID削除
    timeoutId = undefined;
  }

  result = useRepReactionList();

  //なんかたまにリアクション取得されないときの対策でビジブル変わったときにフィルター再設置してみる
  function onVisibilityChange() {
    if (document?.visibilityState === "visible") {
      debounceUpdate();
    }
  }
</script>

<svelte:document on:visibilitychange={onVisibilityChange} />
