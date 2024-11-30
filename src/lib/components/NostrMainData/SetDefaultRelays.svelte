<script lang="ts">
  import { useRelaySet } from "$lib/stores/useRelaySet";
  import type { ReqResult, ReqStatus } from "$lib/types";
  import { derived, readable, type Readable } from "svelte/store";
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
  import { app, loginUser } from "$lib/stores/stores";

  interface Props {
    pubkey: string;
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
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;

    contents?: import("svelte").Snippet<
      [{ relays: DefaultRelayConfig[] | string[]; status: ReqStatus }]
    >;
  }
  let {
    req = undefined,
    pubkey,
    localRelays,
    paramRelays = undefined,
    // relayChange,
    error,
    loading,
    nodata,
    contents,
  }: Props = $props();

  //$inspect(derivedUser);
  let queryKey = ["defaultRelay", pubkey];
  let filters = [
    // { authors: [pubkey], kinds: [3], limit: 1 },
    { authors: [pubkey], kinds: [10002], limit: 1 },
  ] as Nostr.Filter[];

  //パラムリレーがあったりlocalリレーがあるときはそれを返す。なかったら10002リレーを探す。
  //返すのとSetrelaysもしないといけないっぽい？

  let result =
    localRelays.length === 0 && (!paramRelays || paramRelays.length === 0)
      ? useRelaySet(queryKey, filters, req)
      : undefined;
  let data: DefaultRelayConfig[] | null | undefined | string[] = $state();
  let status: ReqStatus | undefined = $state();
  let errorData: Error | undefined = $state();

  result?.data.subscribe((value: DefaultRelayConfig[] | null | undefined) => {
    // console.log(value);
    if (value && value.length > 0) {
      data = value;
      //setRelays(defaultRelays);セットリレーはuseRelaySetの方にかいてあるからいらない
    }
  });
  result?.status.subscribe((value: ReqStatus | undefined) => {
    // console.log(value);
    if (value) {
      status = value;
      if (value === "success" && !result.data) {
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
  app.subscribe((value) => {
    // console.log(value, localRelays, paramRelays);
    if (
      value &&
      (localRelays.length > 0 || (paramRelays && paramRelays.length > 0))
    ) {
      //console.log(localRelays, paramRelays);
      setRelays($state.snapshot(localRelays || paramRelays));
    }
  });
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
  <!-- {#await setRelays(localRelays || paramRelays) then} -->
  {@render contents?.({
    relays: $state.snapshot(localRelays || paramRelays),
    status: "success",
  })}
  <!-- {/await} -->
{:else}
  {@render contents?.({
    relays: defaultRelays,
    status: status ?? "success",
  })}
{/if}
