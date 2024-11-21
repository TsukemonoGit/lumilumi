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

  export let req:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | undefined = undefined;
  let relays: DefaultRelayConfig[] | undefined = undefined;
  export let paramRelays: string[] | undefined;
  export let localRelays: DefaultRelayConfig[];
  export let pubkey: string;
  console.log(pubkey);
  $: result = pubkey
    ? deriveResult(localRelays, pubkey, req)
    : $loginUser !== ""
      ? deriveResult(localRelays, $loginUser, req)
      : setLoadRelays();

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

  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;
  $: console.log($status);
  $: if (
    ($status === "success" && !$data) ||
    ($data !== undefined && $data.length <= 0)
  ) {
    //ノーデータだったときにデフォルトリレーをセット
    setRelays(defaultRelays);
    //適当にデータ返しておこう
    result = {
      data: readable(defaultRelays),
      status: readable("success" as ReqStatus),
      error: readable(undefined),
    };
  }
  interface $$Slots {
    default: {
      relays: DefaultRelayConfig[];
      status: ReqStatus;
    };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if relays}
  <slot {relays} status="success" />
{:else if $error}
  <slot name="error" error={$error} />
{:else if $data && $data.length > 0}
  <slot relays={localRelays ?? $data} status={$status ?? "error"} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
