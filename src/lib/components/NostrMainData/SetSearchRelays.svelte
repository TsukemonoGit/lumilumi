<script lang="ts">
  import { setRelays } from "$lib/func/nostr";

  import { loginUser, queryClient } from "$lib/stores/stores";
  import type { DefaultRelayConfig } from "rx-nostr";

  export let defaultRelays: DefaultRelayConfig[];
  export let setRelayList: string[];

  console.log(defaultRelays);
  let searchRelays: DefaultRelayConfig[] = [...defaultRelays];
  console.log($queryClient.getQueryData(["defaultRelay", $loginUser]));
  searchRelays.forEach((relay) => (relay.read = false));
  setRelayList.forEach((url) => {
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
