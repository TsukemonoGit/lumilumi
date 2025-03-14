<script lang="ts">
  import { nip19 } from "nostr-tools";

  import { parseNaddr } from "$lib/func/util";
  import * as Nostr from "nostr-typedef";

  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";

  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";
  import EllipsisMenuNaddr from "../NoteActionButtuns/EllipsisMenuNaddr.svelte";
  import EventCard from "./EventCard.svelte";
  import OmittedCard from "./OmittedCard.svelte";
  import { page } from "$app/state";
  import { loginUser } from "$lib/stores/stores";
  import { nip33Regex, relayRegex } from "$lib/func/regex";
  import NoteByRelayhint from "../NoteByRelayhint.svelte";
  import NaddrByRelayhint from "../NaddrByRelayhint.svelte";
  import EmptyCard from "./EmptyCard.svelte";

  interface Props {
    displayMenu: boolean;
    repostable: boolean;
    maxHeight: number | undefined;
    //tagはaかe
    tag: string[];
    zIndex?: number;
    depth: number;
    tieKey: string | undefined;
  }

  let {
    displayMenu,
    repostable,
    maxHeight,
    tag,
    depth,
    tieKey,
    zIndex,
  }: Props = $props();

  const naddrFilter = (): Nostr.Filter | undefined => {
    const match = tag[1].match(nip33Regex);
    //console.log(match);
    if (match && match.length > 3) {
      const filter: Nostr.Filter =
        match[3] !== ""
          ? {
              kinds: [Number(match[1])],
              authors: [match[2]],
              "#d": [match[3]],
            }
          : {
              kinds: [Number(match[1])],
              authors: [match[2]],
            };
      return filter;
    }
    return undefined;
  };

  const encodeNaddr = (tag: string[]) => {
    const address = parseNaddr(tag);
    try {
      return nip19.naddrEncode(address);
    } catch (error) {
      return undefined;
    }
  };
  let relayhint = $derived(
    tag.length > 2 && relayRegex.test(tag[2]) ? [tag[2]] : undefined
  );
</script>

{#if tag[0] === "e"}
  <Text queryKey={["timeline", tag[1]]} id={tag[1]}>
    {#snippet loading()}<EmptyCard
        nevent={displayMenu ? nip19.noteEncode(tag[1]) : undefined}
        >Loading {nip19.noteEncode(tag[1])}</EmptyCard
      >
    {/snippet}
    {#snippet nodata()}
      <div>
        {#if relayhint && relayhint.length > 0}
          <NoteByRelayhint
            id={tag[1]}
            {displayMenu}
            {depth}
            {repostable}
            {tieKey}
            {relayhint}
          />
        {:else}<EmptyCard
            nevent={displayMenu ? nip19.noteEncode(tag[1]) : undefined}
            >not found {nip19.noteEncode(tag[1])}</EmptyCard
          >
        {/if}
      </div>
    {/snippet}
    {#snippet error()}<EmptyCard
        nevent={displayMenu ? nip19.noteEncode(tag[1]) : undefined}
        >not found {nip19.noteEncode(tag[1])}</EmptyCard
      >
    {/snippet}
    {#snippet content({ data: text })}
      {#if page.route.id === "/notifications" && depth === 1 && text.pubkey === $loginUser}
        <OmittedCard
          {text}
          {depth}
          {repostable}
          {maxHeight}
          {displayMenu}
          {tieKey}
          {zIndex}
        />
      {:else}
        <Metadata queryKey={["metadata", text.pubkey]} pubkey={text.pubkey}>
          {#snippet loading()}
            <div>
              <EventCard
                note={text}
                {depth}
                {repostable}
                {maxHeight}
                {displayMenu}
                {tieKey}
              />
            </div>
          {/snippet}
          {#snippet nodata()}
            <div>
              <EventCard
                note={text}
                {depth}
                {repostable}
                {maxHeight}
                {displayMenu}
                {tieKey}
              />
            </div>
          {/snippet}
          {#snippet error()}
            <div>
              <EventCard
                note={text}
                {depth}
                {repostable}
                {maxHeight}
                {displayMenu}
                {tieKey}
              />
            </div>
          {/snippet}
          {#snippet content({ metadata })}
            <EventCard
              note={text}
              {metadata}
              {depth}
              {repostable}
              {maxHeight}
              {displayMenu}
              {tieKey}
            />
          {/snippet}
        </Metadata>{/if}
    {/snippet}
  </Text>
{:else if tag[0] === "a"}
  {@const filter = naddrFilter()}
  {@const encodedNaddr = encodeNaddr(tag)}
  {#if filter}
    <LatestEvent filters={[filter]} queryKey={["naddr", tag[1]]}>
      {#snippet loading()}
        <div>
          Loading {tag[1]}<EllipsisMenuNaddr naddr={encodedNaddr} />
        </div>
      {/snippet}
      {#snippet nodata()}
        <div>
          {#if relayhint && relayhint.length > 0}
            <NaddrByRelayhint
              data={parseNaddr(tag)}
              content={tag[1]}
              {displayMenu}
              {depth}
              {repostable}
              {tieKey}
              {relayhint}
            />
          {:else}
            <div
              class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
            >
              Nodata {tag[1]}{#if displayMenu}<EllipsisMenuNaddr
                  naddr={encodedNaddr}
                />{/if}
            </div>{/if}
        </div>
      {/snippet}
      {#snippet error()}
        <div>
          {tag[1]}<EllipsisMenuNaddr naddr={encodedNaddr} />
        </div>
      {/snippet}
      {#snippet children({ event })}
        {#if page.route.id === "/notifications" && depth === 1 && event.pubkey === $loginUser}
          <OmittedCard
            text={event}
            {depth}
            {repostable}
            {maxHeight}
            {displayMenu}
            {tieKey}
            {zIndex}
          />
        {:else}
          <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
            {#snippet loading()}
              <div class="w-full">
                <EventCard
                  note={event}
                  {depth}
                  {repostable}
                  {maxHeight}
                  {displayMenu}
                  {tieKey}
                />
              </div>
            {/snippet}
            {#snippet nodata()}
              <div class="w-full">
                <EventCard
                  note={event}
                  {depth}
                  {repostable}
                  {maxHeight}
                  {displayMenu}
                  {tieKey}
                />
              </div>
            {/snippet}
            {#snippet error()}
              <div class="w-full">
                <EventCard
                  note={event}
                  {depth}
                  {repostable}
                  {maxHeight}
                  {displayMenu}
                  {tieKey}
                />
              </div>
            {/snippet}
            {#snippet content({ metadata })}
              <EventCard
                note={event}
                {metadata}
                {depth}
                {repostable}
                {maxHeight}
                {displayMenu}
                {tieKey}
              />
            {/snippet}
          </Metadata>{/if}
      {/snippet}
    </LatestEvent>
  {/if}
{/if}
