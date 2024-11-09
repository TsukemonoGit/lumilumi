<script lang="ts">
  import { useNip05Check } from "$lib/func/nip05check";
  import type { ReqStatus } from "$lib/types";

  export let pubkey: string;
  export let nip05Address: string;
  $: nip05 = useNip05Check(nip05Address, pubkey);
  $: data = nip05.data;
  $: status = nip05.status;
  $: error = nip05.error;
  $: console.log($data);
  interface $$Slots {
    default: { nip05: { result: boolean; error?: string }; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if $data !== null && $data !== undefined}
  <slot nip05={$data} status={$status} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
