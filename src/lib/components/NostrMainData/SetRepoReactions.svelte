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

  // export let rxNostr: RxNostr | undefined = undefined;

  //export let events: Nostr.Event<number>[];

  let filters: Nostr.Filter[] = [];
  let result: { data: any; status: any; error: any };

  // let lastUpdateTimestamp = Date.now() + 3000; // 初回は余裕を持たせる
  const updateInterval = 2000; // 1秒（ミリ秒）
  let timeoutId: NodeJS.Timeout | undefined = undefined;
  let updating = false;
  // $: console.log($viewEventIds);
  $: etagList = Array.from(
    new Set($viewEventIds.filter((tag) => tag[0] === "e").map((tag) => tag[1]))
  );
  $: atagList = Array.from(
    new Set($viewEventIds.filter((tag) => tag[0] === "a").map((tag) => tag[1]))
  );
  $: if (etagList || atagList) {
    debounceUpdate();
  }
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

  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;

  interface $$Slots {
    default: { events: Nostr.Event[]; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }

  //なんかたまにリアクション取得されないときの対策でビジブル変わったときにフィルター再設置してみる
  function onVisibilityChange() {
    if (document?.visibilityState === "visible") {
      debounceUpdate();
    }
  }
</script>

<svelte:document on:visibilitychange={onVisibilityChange} />
{#if $error}
  <slot name="error" {error} />
{:else if $data}
  <slot events={$data.event} {status} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
