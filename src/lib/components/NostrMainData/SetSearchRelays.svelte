<script lang="ts">
  import { setRelays } from "$lib/func/nostr";
  import { loginUser, queryClient } from "$lib/stores/stores";
  import type { DefaultRelayConfig } from "rx-nostr";

  export let defaultRelays: DefaultRelayConfig[];
  export let setRelayList: string[];

  // defaultRelays の中で read が true のものを含むように searchRelays を初期化
  let searchRelays: DefaultRelayConfig[] = defaultRelays.filter(
    (relay) => relay.read === true
  );
  console.log($queryClient.getQueryData(["defaultRelay", $loginUser]));

  // setRelayList に基づいて searchRelays を更新
  setRelayList.forEach((url) => {
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
