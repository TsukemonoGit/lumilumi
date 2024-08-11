<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { setRelays } from "$lib/func/nostr";
  import { loginUser, queryClient } from "$lib/stores/stores";
  //import type { DefaultRelayConfig } from "rx-nostr";
  import { onMount } from "svelte";

  //export let defaultRelays: DefaultRelayConfig[];
  export let setRelayList: string[];
  let loading = true;
  // defaultRelays の中で write が true のものを含むように searchRelays を初期化
  // let searchRelays: DefaultRelayConfig[] = defaultRelays.filter(
  //   (relay) => relay.write === true
  // );
  onMount(() => {
    setSearchRelay();
  });

  afterNavigate(() => {
    setSearchRelay();
  });
  function setSearchRelay() {
    const defaultRelays = $queryClient.getQueryData([
      "defaultRelay",
      $loginUser,
    ]);
    if (!defaultRelays) {
      setRelays(setRelayList);
    } else {
      //デフォリレーがあるときはそれ使うことにする。どうせデフォリレーの中の何個かが入ったSeenonがneventの中に入ってるだけだし
    }
    loading = false;
  }
</script>

{#if loading}
  <!---->
{:else}
  <slot />
{/if}
