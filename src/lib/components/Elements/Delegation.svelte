<script lang="ts">
  import { UserRoundCheck } from "lucide-svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
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

  let label = $derived($_("event.delegation.signedBy", { npub }));
</script>

<span
  class="absolute top-1 left-0 text-sky-500"
  style={`z-index:${zIndex || 10 + 1}`}
  title={label}
  aria-label={label}
>
  <UserRoundCheck size={14} class="fill-sky-200" />
</span>
