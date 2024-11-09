<script lang="ts">
  import { queryClient, showImg } from "$lib/stores/stores";
  import {
    CircleMinus,
    BadgeAlert,
    ShieldCheck,
    Loader,
    AtSign,
  } from "lucide-svelte";
  import UseNip05Check from "./UseNip05Check.svelte";
  import { _ } from "svelte-i18n";

  export let pubkey: string;
  export let nip05Address: string;
  const size = 16;
  let doCheck = false;

  $: data = $queryClient?.getQueryData(["nip05", nip05Address]);
  $: if (data) {
    doCheck = true;
  }
  // });
</script>

{#if !doCheck}
  <button
    title="Verify NIP-05 Address"
    class="ml-1 inline-flex text-neutral-200 my-auto border border-neutral-200 bg-neutral-700 rounded-full items-center px-1 hover:opacity-75 gap-0.5 font-semibold"
    on:click={() => (doCheck = true)}
    ><AtSign {size} />{$_("nip05.verify")}</button
  >
{:else}
  <UseNip05Check {pubkey} {nip05Address} let:nip05>
    <Loader
      slot="loading"
      {size}
      class="ml-1 inline-flex text-gray-400 my-auto"
    />
    <BadgeAlert
      slot="error"
      {size}
      class="ml-1 inline-flex text-red-600  my-auto"
    />
    {#if nip05.result === true}<ShieldCheck
        {size}
        class="ml-1 inline-flex text-green-600  my-auto"
      />
    {:else if nip05.result === false}
      <span class="ml-1 inline-flex items-center text-red-600 my-auto text-sm"
        ><BadgeAlert {size} />{$_(`nip05.error.${nip05.error}`) ?? ""}</span
      >
    {/if}
  </UseNip05Check>
{/if}
