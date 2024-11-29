<script lang="ts">
  import { useRelaySet } from "$lib/stores/useRelaySet";
  import type { ReqResult, ReqStatus } from "$lib/types";
  import { readable, type Readable } from "svelte/store";
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

  let result:
    | ReqResult<DefaultRelayConfig[] | string[]>
    | {
        data: Readable<DefaultRelayConfig[] | string[]>;
        status: Readable<ReqStatus>;
        error: Readable<any>;
      }
    | undefined;
  let relays: DefaultRelayConfig[] | undefined = undefined;

  console.log(pubkey);
  loginUser.subscribe((value) => {
    userChange(value);
  });
  // $effect(() => {
  //   userChange($loginUser);
  //   // let result = pubkey
  //   //   ? deriveResult(localRelays, pubkey, req)
  //   //   : $loginUser !== ""
  //   //     ? deriveResult(localRelays, $loginUser, req)
  //   //     : setLoadRelays();
  // });

  function userChange(user: string) {
    if (pubkey) {
      result = deriveResult(localRelays, pubkey, req);
    } else if (user && user !== "") {
      result = deriveResult(localRelays, user, req);
    } else {
      console.log(user, pubkey);
      result = setLoadRelays();
    }
  }
  //個々に来た段階でpubkeyがないってことは設定がないで、homeに来てたら設定に飛ぶから、それ以外のnoteのページとかに直できたときだから、
  //paramにリレーが設定されてたらそれを使ってなかったらなんか適当にデフォルトリレーセットしよう
  function setLoadRelays():
    | {
        data: Readable<DefaultRelayConfig[] | string[]>;
        status: Readable<ReqStatus>;
        error: Readable<any>;
      }
    | undefined {
    if (paramRelays) {
      setRelays(paramRelays);
      return {
        data: readable(paramRelays),
        status: readable("success" as ReqStatus),
        error: readable(undefined),
      };
    } else {
      setRelays(defaultRelays);
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

  let data:
    | Readable<DefaultRelayConfig[] | null | undefined | string[]>
    | string[]
    | undefined = result?.data;
  let status = $derived(result?.status);
  let errorData = $derived(result?.error);
  // console.log($status);
  $effect(() => {
    if ($data && $status) {
      dataChange($status, $data);
    }
  });
  function dataChange(
    status: string | undefined,
    data: string | any[] | null | undefined
  ) {
    if ((status === "success" && !data) || (data && data.length <= 0)) {
      //ノーデータだったときにデフォルトリレーをセット
      setRelays(defaultRelays);
      //適当にデータ返しておこう
      result = {
        data: readable(defaultRelays),
        status: readable("success" as ReqStatus),
        error: readable(undefined),
      };
    }
  }
  // $: if (
  //   ($status === "success" && !$data) ||
  //   ($data !== undefined && $data.length <= 0)
  // ) {
  //   //ノーデータだったときにデフォルトリレーをセット
  //   setRelays(defaultRelays);
  //   //適当にデータ返しておこう
  //   result = {
  //     data: readable(defaultRelays),
  //     status: readable("success" as ReqStatus),
  //     error: readable(undefined),
  //   };
  // }
</script>

{#if relays}{@render contents?.({ relays: relays, status: "success" })}
  <!-- <slot {relays} status="success" /> -->
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
  <!-- {@const relays = setRelays(defaultRelays)}
  {@render children?.({ relays: defaultRelays, status: "success" })} -->
{/if}
