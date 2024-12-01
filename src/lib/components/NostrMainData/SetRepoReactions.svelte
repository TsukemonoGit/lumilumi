<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  import { useRepReactionList } from "$lib/stores/useRepReactionList";
  import {
    viewEventIds,
    loginUser,
    showAllReactions,
  } from "$lib/stores/stores";
  import type { ReqStatus } from "$lib/types";
  import type Nostr from "nostr-typedef";

  import { changeEmit } from "$lib/func/reactions";
  import { untrack, type Snippet } from "svelte";

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
  // $: console.log($viewEventIds);
  let etagList = $derived(
    Array.from(
      new Set(
        $viewEventIds.filter((tag) => tag[0] === "e").map((tag) => tag[1])
      )
    )
  );

  let atagList = $derived(
    Array.from(
      new Set(
        $viewEventIds.filter((tag) => tag[0] === "a").map((tag) => tag[1])
      )
    )
  );

  $effect(() => {
    if (etagList || atagList) {
      untrack(() => debounceUpdate());
    }
  });

  function debounceUpdate() {
    if (updating) {
      return;
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    updating = true;
    timeoutId = setTimeout(() => {
      performUpdate();
      console.log(etagList.length, atagList.length);
      updating = false;
    }, updateInterval); // 連続で実行されるのを防ぐ
  }

  function performUpdate() {
    if ((etagList.length <= 0 && atagList.length <= 0) || !$loginUser) return;

    filters =
      etagList.length > 0
        ? [
            {
              "#e": etagList,
              authors: $showAllReactions ? undefined : [$loginUser],
              kinds: [7, 6, 16],
            },
            {
              "#e": etagList,
              kinds: [9735],
            },
          ]
        : [];
    if (atagList.length > 0) {
      filters.push(
        {
          "#a": atagList,
          authors: $showAllReactions ? undefined : [$loginUser],
          kinds: [7, 6, 16],
        },
        {
          "#a": atagList,
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
  {@render content({ events: $data.event, status: status })}
  <!-- <slot events={$data.event} {status} /> -->
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
