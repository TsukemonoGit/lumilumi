<!--ContentImage.svelte-->
<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { t as _ } from '@konemono/svelte5-i18n';

  let imgError: boolean = $state(false);
  let imgLoad: boolean = $state(false);
  interface Props {
    src?: string | undefined;
    url?: string | undefined;
    number?: number | undefined;
    openModal: (index: number) => void;
  }

  let {
    src = undefined,
    url = undefined,
    number = undefined,
    openModal,
  }: Props = $props();
  let view = $state(false);
</script>

{#if (lumiSetting.get().showImg && !imgError) || view}
  {#if !imgLoad}<Link
      props={{ "aria-label": `External Links: ${url}` }}
      className="underline text-magnum-300 break-all "
      href={url ?? ""}>{src}</Link
    >{/if}
  <div>
    <button
      class="w-fit h-fit overflow-hidden"
      aria-label={$_("alia.label.image")}
      onclick={() => openModal(number ?? 0)}
      ><img
        loading="lazy"
        width="288"
        height="200"
        alt="img"
        {src}
        class=" max-w-[min(18rem,100%)] max-h-[18rem] object-contain overflow-hidden"
        onload={() => (imgLoad = true)}
        onerror={() => (imgError = true)}
      /></button
    >
  </div>{:else if imgError}
  <Link
    props={{ "aria-label": `External Links: ${url}` }}
    className="underline text-magnum-300 break-all "
    href={url ?? ""}>{src}</Link
  >{:else}
  <button
    class=" rounded-md border font-semibold border-magnum-600 text-magnum-200 p-1 m-1 hover:opacity-75 active:opacity-50"
    onclick={() => (view = true)}>View Image</button
  >{/if}
