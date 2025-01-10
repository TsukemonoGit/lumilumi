<script lang="ts">
  import { useRepReactionList } from "$lib/stores/useRepReactionList";
  import { loginUser } from "$lib/stores/stores";
  import type { ReqStatus } from "$lib/types";
  import type Nostr from "nostr-typedef";

  import { changeEmit } from "$lib/func/reactions";
  import { untrack, type Snippet } from "svelte";
  import { lumiSetting, viewEventIds } from "$lib/stores/globalRunes.svelte";

  interface Props {
    error?: Snippet;
    nodata?: Snippet;
    content?: Snippet<[{ events: Nostr.Event[]; status: ReqStatus }]>;
    loading?: Snippet;
  }
  let { error, nodata, content, loading }: Props = $props();

  // export let rxNostr: RxNostr | undefined = undefined;

  //export let events: Nostr.Event<number>[];

  let filters: Nostr.Filter[] = [];
  let result: { data: any; status: any; error: any };

  // let lastUpdateTimestamp = Date.now() + 3000; // 初回は余裕を持たせる
  const updateInterval = 2000; // 1秒（ミリ秒）
  let timeoutId: NodeJS.Timeout | undefined = undefined;
  let updating = false;
  // $: console.log(viewEventIds.get);
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
  //  $derived(
  //   Array.from(
  //     new Set(
  //       viewEventIds
  //         .get()
  //         .filter((tag) => tag[0] === "e")
  //         .map((tag) => tag[1])
  //     )
  //   )
  // );

  //  $derived(
  //   Array.from(
  //     new Set(
  //       viewEventIds
  //         .get()
  //         .filter((tag) => tag[0] === "a")
  //         .map((tag) => tag[1])
  //     )
  //   )
  // );

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
    if ((etagList.length <= 0 && atagList.length <= 0) || !$loginUser) return;

    filters =
      etagList.length > 0
        ? [
            {
              "#e": $state.snapshot(etagList),
              authors: lumiSetting.get().showAllReactions
                ? undefined
                : [$loginUser],
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
            : [$loginUser],
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

  let data = $derived(result?.data);
  let status = $derived(result?.status);
  let errorData = $derived(result?.error);

  //なんかたまにリアクション取得されないときの対策でビジブル変わったときにフィルター再設置してみる
  function onVisibilityChange() {
    if (document?.visibilityState === "visible") {
      debounceUpdate();
    }
  }
</script>

<svelte:document on:visibilitychange={onVisibilityChange} />

{#if $errorData}
  {@render error?.()}
{:else if $data}
  {@render content?.({ events: $data.event, status: status })}
  <!-- <slot events={$data.event} {status} /> -->
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
