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

  export let queryKey: QueryKey;
  export let pubkey: string;
  export let req:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined = undefined;

  let initialDataUpdatedAt: number;
  const staleTime: number = Infinity;
  let refetchInterval: number = Infinity;
  //initialEataのUpdatedAtを古めにしておいてstaleTimeはちょっと長めにしておくことで、とりあえず前回の最新メタデータを表示しておいて後々最新のMetadataを取ってくることができる？
  let initData: EventPacket | undefined = $showImg
    ? undefined
    : getMetadata(queryKey); //画像オンのときは初っ端最新チェックなのでinitDataいらない
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

  $: result = useMetadata(
    $app.rxNostr,
    queryKey,
    pubkey,
    req,
    initData,
    staleTime,
    initialDataUpdatedAt,
    refetchInterval
  );
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Slots {
    default: { metadata: Nostr.Event; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if $data}
  <slot metadata={$data?.event} status={$status} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
