<!--repostednote.svelte-->
<script lang="ts">
  import { parseNaddr } from "$lib/func/util";
  import Note from "../Note.svelte";
  import NaddrEvent from "../NaddrEvent.svelte";
  import { page } from "$app/state";

  interface Props {
    displayMenu: boolean;
    repostable: boolean;
    maxHeight: number | undefined;
    tag: string[];
    zIndex?: number;
    depth: number;
    mini: boolean;
  }

  const { displayMenu, repostable, maxHeight, tag, depth, zIndex, mini }: Props =
    $props();

  const validateTag = (tag: string[], expectedType: string) =>
    tag && Array.isArray(tag) && tag.length > 1 && tag[0] === expectedType;

  const isETag = $derived(validateTag(tag, "e"));
  const isATag = $derived(validateTag(tag, "a"));
  const tagId = $derived(tag?.[1]);
  const relayHint = $derived(tag?.[2]?.trim() ? [tag[2].trim()] : undefined);
  const isNotificationRoute = $derived(
    page.route?.id === "/notifications" && depth === 1
  );

  const commonProps = $derived({
    displayMenu,
    depth,
    repostable,
    zIndex,
    omit: isNotificationRoute,
  });
</script>

{#if isETag && tagId}
  <Note {...commonProps} relayhint={relayHint} id={tagId} {mini} {maxHeight} />
{:else if isATag && tagId}
  <NaddrEvent
    {...commonProps}
    data={parseNaddr(tag)}
    content={tagId}
    mini={true}
  />
{:else}
  <div class="invalid-tag">
    {tag ? JSON.stringify(tag) : "No tag data"}
  </div>
{/if}
