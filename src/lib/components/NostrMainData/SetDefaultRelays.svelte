<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  import { useRelaySet } from "$lib/stores/useRelaySet";
  import type { ReqStatus } from "$lib/types";
  import { readable } from "svelte/store";
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
  import { loginUser } from "$lib/stores/stores";

  interface Props {
    pubkey: string;
    localRelays: DefaultRelayConfig[];
    paramRelays: string[];
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

    contents?: import("svelte").Snippet<
      [{ relays: DefaultRelayConfig[] | string[]; status: ReqStatus }]
    >;
  }
  let {
    paramRelays,
    pubkey,
    localRelays,
    req = undefined,
    error,
    loading,
    nodata,
    contents,
  }: Props = $props();

  let relays: DefaultRelayConfig[] | undefined = undefined;

  console.log(pubkey);
  let result: any;
  loginUser.subscribe(() => {
    result = pubkey
      ? deriveResult(localRelays, pubkey, req)
      : $loginUser !== ""
        ? deriveResult(localRelays, $loginUser, req)
        : setLoadRelays();
  });
  //個々に来た段階でpubkeyがないってことは設定がないで、homeに来てたら設定に飛ぶから、それ以外のnoteのページとかに直できたときだから、
  //paramにリレーが設定されてたらそれを使ってなかったらなんか適当にデフォルトリレーセットしよう
  function setLoadRelays() {
    if (paramRelays) {
      setRelays(paramRelays);
      //適当にデータ返しておこう
      return {
        data: readable(paramRelays),
        status: readable("success" as ReqStatus),
        error: readable(undefined),
      };
    } else {
      setRelays(defaultRelays);
      //適当にデータ返しておこう
      return {
        data: readable(defaultRelays),
        status: readable("success" as ReqStatus),
        error: readable(undefined),
      };
    }
  }

  function deriveResult(
    localRelays: DefaultRelayConfig[],
    pubkey: string,
    req:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined
  ) {
    if (!localRelays || localRelays.length <= 0) {
      return useRelaySet(
        ["defaultRelay", pubkey],
        [
          // { authors: [pubkey], kinds: [3], limit: 1 },
          { authors: [pubkey], kinds: [10002], limit: 1 },
        ] as Nostr.Filter[],
        req
      );
    } else {
      return {
        data: readable(localRelays),
        status: readable("success" as ReqStatus),
        error: readable(undefined),
      };
    }
  }

  let data = $derived(result?.data);
  let status = $derived(result?.status);
  let errorData = $derived(result?.error);
  // $: console.log($status);
  // data?.subscribe(()=>{ if (
  //   ($status === "success" && !$data) ||
  //   ($data !== undefined && ($data?.length??0 <= 0))
  // ) {
  //   //ノーデータだったときにデフォルトリレーをセット
  //   setRelays(defaultRelays);
  //   //適当にデータ返しておこう
  //   result = {
  //     data: readable(defaultRelays),
  //     status: readable("success" as ReqStatus),
  //     error: readable(undefined),
  //   };
  // }})
</script>

{#if relays}
  {@render contents?.({ relays: relays, status: "success" })}
{:else if $status === "success" && !$data}
  {@render contents?.({ relays: defaultRelays, status: $status ?? "error" })}
{:else if $errorData}
  {@render error?.($errorData)}
{:else if $data && $data.length > 0}
  {@render contents?.({
    relays: localRelays ?? $data,
    status: $status ?? "error",
  })}
  <!-- <slot relays={localRelays ?? $data} status={$status ?? "error"} /> -->
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
