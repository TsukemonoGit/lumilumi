<script lang="ts">
  import { useRelaySet } from "$lib/stores/useRelaySet";
  import type { ReqStatus, RxReqBase } from "$lib/types";
  import { readable } from "svelte/store";
  import type Nostr from "nostr-typedef";
  import { type DefaultRelayConfig, type RxNostr } from "rx-nostr";
  import { useRepReactionList } from "$lib/stores/useRepReactionList";
  export let rxNostr: RxNostr;
  export let req: RxReqBase | undefined = undefined;
  export let relays: DefaultRelayConfig[] | undefined = undefined;
  export let filters: Nostr.Filter[];

  $: if (relays) {
    rxNostr.setDefaultRelays(relays);
  }

  $: useRepReactionList(rxNostr, filters, req);
</script>
