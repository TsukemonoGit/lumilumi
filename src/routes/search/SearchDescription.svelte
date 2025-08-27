<script>
  import { t as _ } from '@konemono/svelte5-i18n';
  import Link from "$lib/components/Elements/Link.svelte";
</script>

<p>{$_("relay.description.search")}</p>
<p>{$_("relay.description.search2")}</p>

<p>
  {$_("relay.description.search3")}
  <Link
    className="underline hover:opacity-75"
    href="https://github.com/nostr-protocol/nips/blob/master/50.md"
    >(NIP-50)</Link
  >
</p>
