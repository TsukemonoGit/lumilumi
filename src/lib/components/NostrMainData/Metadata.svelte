<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  //proxyをあれするやつ
  import { useMetadata } from "$lib/stores/useMetadata";
  import type { ReqStatus } from "$lib/types";
  import { app, showImg } from "$lib/stores/stores";

  import { type QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import {
    type EventPacket,
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
  } from "rx-nostr";
  import { getMetadata } from "$lib/func/nostr";

  interface Props {
    queryKey: QueryKey;
    pubkey: string;
    req?:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined;
    error?: import("svelte").Snippet<[Error]>;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;

    content?: import("svelte").Snippet<
      [{ metadata: Nostr.Event; status: ReqStatus }]
    >;
  }
  let {
    req = undefined,
    pubkey,
    queryKey,

    error,
    loading,
    nodata,
    content,
  }: Props = $props();

  //let initialDataUpdatedAt: number;
  const staleTime: number = Infinity;
  let refetchInterval: number = Infinity;
  //initialEataのUpdatedAtを古めにしておいてstaleTimeはちょっと長めにしておくことで、とりあえず前回の最新メタデータを表示しておいて後々最新のMetadataを取ってくることができる？
  const localData = getMetadata(queryKey);
  //console.log(localData);
  const initData: EventPacket | undefined = $showImg ? undefined : localData; //画像オンのときは初っ端最新チェックなのでinitDataいらないけど代わりにローディングのときとかにおいてみる
  //console.log(initData);
  //if (!$showImg) {
  // staleTime = Infinity;
  // }
  //else {
  //画像表示オンのときはローカルデータ使わないで新しく取得する
  //if (initData) {
  //staleTime = Infinity;
  //refetchInterval = Infinity;
  //initialDataUpdatedAt = now() * 1000 - 2 * 57 * 60 * 1000; //2hよりちょっと前//最初詠み込まれたときにドバっとなって重くなるのを防ぐ
  // staleTime = 2 * 60 * 60 * 1000; //2h
  // refetchInterval = 2 * 60 * 60 * 1000;
  //}
  // }

  let result = $derived(
    useMetadata(
      $app.rxNostr,
      queryKey,
      pubkey,
      req,
      initData,
      staleTime,
      undefined,
      refetchInterval
    )
  );
  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);

  let metadata = $derived($data?.event ?? localData?.event);
  //$inspect(metadata);
</script>

{#if metadata}
  {@render content?.({ metadata: metadata, status: $status })}
  <!-- <slot {metadata} status={$status} /> -->
{:else if $errorData}
  {@render error?.($errorData)}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
