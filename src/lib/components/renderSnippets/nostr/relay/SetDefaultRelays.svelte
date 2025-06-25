<script lang="ts">
  import { useRelaySet } from "$lib/stores/useRelaySet";
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";
  import {
    type DefaultRelayConfig,
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
  } from "rx-nostr";
  import { setRelays } from "$lib/func/nostr";
  import { defaultRelays } from "$lib/stores/relays";
  import { app } from "$lib/stores/stores";
  import { get } from "svelte/store";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  interface Props {
    // pubkey: string;
    localRelays: DefaultRelayConfig[];
    paramRelays: string[] | undefined;
    req?:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined;
    //relayChange: (data: string[]) => void;
    error?: import("svelte").Snippet<[Error]>;

    loading?: import("svelte").Snippet;

    contents?: import("svelte").Snippet<
      [{ relays: DefaultRelayConfig[] | string[]; status: ReqStatus }]
    >;
  }
  let {
    req = undefined,
    // pubkey,
    localRelays,
    paramRelays = undefined,
    // relayChange,
    error,
    loading,
    contents,
  }: Props = $props();
  let pubkey = lumiSetting.get().pubkey;
  let queryKey = ["defaultRelay", pubkey];
  let filters = [
    // { authors: [pubkey], kinds: [3], limit: 1 },
    { authors: [pubkey], kinds: [10002], limit: 1 },
  ] as Nostr.Filter[];

  //パラムリレーがあったりlocalリレーがあるときはそれを返す。なくて、ログインしてるときに10002とる。ログインしてなかったらデフォリレーをセットする。

  let zyouken =
    localRelays.length > 0 ||
    (paramRelays && paramRelays.length > 0) ||
    !lumiSetting.get().pubkey;
  console.log(zyouken);
  let _relays: DefaultRelayConfig[] | string[] =
    paramRelays && paramRelays.length > 0 //neventとかのやつ
      ? paramRelays
      : localRelays.length > 0 //設定でローカルのリレー使うことにしてるときのやつ
        ? localRelays
        : [];

  let result = zyouken ? undefined : useRelaySet(queryKey, filters, req);

  let data: DefaultRelayConfig[] | null | undefined | string[] = $state();
  let status: ReqStatus | undefined = $state();
  let errorData: Error | undefined = $state();

  if (result) {
    result?.data.subscribe((value: DefaultRelayConfig[] | null | undefined) => {
      // console.log(value);
      if (value && value.length > 0) {
        data = value;
        //setRelays(defaultRelays);セットリレーはuseRelaySetの方にかいてあるからいらない
      }
    });
    result?.status.subscribe((value: ReqStatus | undefined) => {
      // console.log(value);
      //resultがsuccessなのにdataがない（りれーがせっとされてない）ときはデフォリレーをいれる。
      if (value) {
        status = value;
        if (
          value === "success" &&
          (!result.data || (get(result.data) || []).length <= 0)
        ) {
          // console.log(defaultRelays);
          setRelays(defaultRelays);
          data = defaultRelays;
        }
      }
    });
    result?.error.subscribe((value: Error | undefined) => {
      if (value) {
        errorData = value;
      }
    });
  } else if (_relays.length > 0) {
    setRelays(_relays);
  } else if (!lumiSetting.get().pubkey) {
    //neventとかじゃなくてリレーなくてログインもしてなかったらデフォリレー
    setRelays(defaultRelays);
  }

  app.subscribe((value) => {
    // console.log(value, localRelays, paramRelays);
    if (
      value &&
      (localRelays.length > 0 || (paramRelays && paramRelays.length > 0))
    ) {
      //localかparamにリレーがあるときは10002じゃなくてlocalかparamのリレーがセットされるところ

      console.log(localRelays, paramRelays);
      setRelays(_relays);
    }
  });
  // $inspect(data, localRelays, paramRelays, errorData);
</script>

{#if errorData}
  {@render error?.(errorData)}
{:else if data && data.length > 0}
  {@render contents?.({
    relays: data,
    status: status ?? "success",
  })}
{:else if status === "loading"}
  {@render loading?.()}
{:else if localRelays.length > 0 || (paramRelays && paramRelays.length > 0)}
  {@render contents?.({
    relays: _relays,
    status: "success",
  })}
{:else}
  {@render contents?.({
    relays: defaultRelays,
    status: status ?? "success",
  })}
{/if}
