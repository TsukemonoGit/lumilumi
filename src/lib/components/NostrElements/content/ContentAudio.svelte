<script lang="ts">
  import Link from "#lib/components/Elements/Link.svelte";
    import type { MuteCheck } from "#lib/func/muteCheck.ts";
  import { lumiSetting } from "#lib/stores/globalRunes.svelte.ts";
  import { t as _ } from "@konemono/svelte5-i18n";

  interface Props {
    url: string;muteType?:MuteCheck
  }

  let { url ,muteType}: Props = $props();

  let audioError = $state(false);
</script>

{#if muteType ==null && lumiSetting.value.showImg && !audioError}
  <audio
    onerror={() => (audioError = true)}
    aria-label="audio contents"
    controls
    src={url}
    class=" object-contain max-w-[min(20rem,100%)] max-h-80"
    ><track default kind="captions" /></audio
  >
{:else}<Link
    props={{ "aria-label": `External Links: ${url}` }}
    className="underline text-magnum-300 break-all hover:opacity-80"
    href={url ?? ""}>{url}</Link
  >{/if}
