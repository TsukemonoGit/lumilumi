<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import { nip19 } from "nostr-tools";
  import { page } from "$app/state";

  import ShowDetail from "./ShowDetail.svelte";

  // npub / nprofile の両方を受け付ける（NIP-05形式は未対応）
  let pubkey = $derived.by(() => {
    const param = page.params.npub ?? "";
    try {
      const decoded = nip19.decode(param);
      if (decoded.type === "npub") return decoded.data;
      if (decoded.type === "nprofile") return decoded.data.pubkey;
    } catch {
      // 不正なパラメータは下のエラー表示に回す
    }
    return "";
  });
</script>

<svelte:head>
  <title>{$_("podcast.title")} - Lumilumi</title>
</svelte:head>

{#if pubkey}
  {#key pubkey}
    <ShowDetail {pubkey} />
  {/key}
{:else}
  <p class="m-2 rounded-md bg-red-500/10 p-3 text-sm text-red-300">
    {$_("podcast.invalidParam")}
  </p>
{/if}
