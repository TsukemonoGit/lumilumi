<script lang="ts">
  import { UserRoundCheck } from "lucide-svelte";
  import * as nip19 from "nostr-tools/nip19";

  // signer: NIP-26 の署名鍵(delegatee)。作者としては表示せず、バッジのツールチップにのみ残す。
  let { signer, zIndex }: { signer: string; zIndex?: number } = $props();

  let npub = $derived.by(() => {
    try {
      return nip19.npubEncode(signer);
    } catch {
      return signer;
    }
  });
</script>

<span
  class="absolute top-1 left-0 text-sky-500"
  style={`z-index:${zIndex || 10 + 1}`}
  title={`NIP-26 delegated · signed by ${npub}`}
  aria-label={`NIP-26 delegated, signed by ${npub}`}
>
  <UserRoundCheck size={14} class="fill-sky-200" />
</span>
