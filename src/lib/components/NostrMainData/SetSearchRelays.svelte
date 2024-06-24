<script lang="ts">
  import { setRelays } from "$lib/func/nostr";
  import { nip50relays } from "$lib/func/util";
  import type { DefaultRelayConfig } from "rx-nostr";

  export let defaultRelays: DefaultRelayConfig[];
  let searchRelays: DefaultRelayConfig[] = [...defaultRelays];

  searchRelays.forEach((relay) => (relay.read = false));
  nip50relays.forEach((url) => {
    // defaultRelays に同じ URL があるかチェック
    const existingRelayIndex = searchRelays.findIndex(
      (relay) => relay.url === url
    );
    if (existingRelayIndex !== -1) {
      // すでに存在する場合は read を true に設定する
      searchRelays[existingRelayIndex].read = true;
    } else {
      // 存在しない場合は新しいエントリとして追加する
      searchRelays.push({ url, read: true, write: false });
    }
  });

  setRelays(searchRelays);
</script>

<slot {searchRelays} />
