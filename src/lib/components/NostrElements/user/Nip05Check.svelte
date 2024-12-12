<script lang="ts">
  import { queryClient } from "$lib/stores/stores";
  import { BadgeAlert, ShieldCheck, Loader, AtSign } from "lucide-svelte";
  import UseNip05Check from "../../renderSnippets/UseNip05Check.svelte";
  import { _ } from "svelte-i18n";
  import { untrack } from "svelte";

  interface Props {
    pubkey: string;
    nip05Address: string;
  }

  let { pubkey, nip05Address }: Props = $props();
  const size = 16;
  let doCheck = $state(false);

  let data = $derived(
    queryClient?.getQueryData(["nip05", pubkey, nip05Address])
  );
  $effect(() => {
    if (data) {
      untrack(() => () => {
        doCheck = true;
      });
    }
  });
  // });
</script>

{#if !doCheck}
  <button
    title="Verify NIP-05 Address"
    class="ml-1 inline-flex text-neutral-200 my-auto border border-neutral-200 bg-neutral-700 rounded-full items-center px-1 hover:opacity-75 gap-0.5 font-semibold"
    onclick={() => (doCheck = true)}
    ><AtSign {size} />{$_("nip05.verify")}</button
  >
{:else}
  <UseNip05Check {pubkey} {nip05Address}>
    {#snippet loading()}
      <Loader {size} class="ml-1 inline-flex text-gray-400 my-auto" />
    {/snippet}
    {#snippet error()}
      <BadgeAlert {size} class="ml-1 inline-flex text-red-600  my-auto" />
    {/snippet}
    {#snippet content({ nip05 })}
      {#if nip05.result === true}<ShieldCheck
          {size}
          class="ml-1 inline-flex text-green-600  my-auto"
        />
      {:else if nip05.result === false}
        <span class="ml-1 inline-flex items-center text-red-600 my-auto text-sm"
          ><BadgeAlert {size} />{$_(`nip05.error.${nip05.error}`) ?? ""}</span
        >
      {/if}
    {/snippet}
  </UseNip05Check>
{/if}
