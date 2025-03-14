<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import {
    extractKind9734,
    getZapLNURLPubkey,
    extractAmount,
  } from "$lib/func/zap";

  import Kind9735Invalid from "./Kind9735Invalid.svelte";
  import ZappedNote from "./ZappedNote.svelte";

  interface Props {
    note: Nostr.Event;
    depth: number;
    excludefunc?: any;
    repostable: boolean;
    maxHeight: number | undefined;
    displayMenu: boolean;
    tieKey: string | undefined;
    mini: any;
    zIndex?: number;
  }

  let {
    note,
    depth,
    excludefunc = (event: Nostr.Event) => false,
    repostable,
    maxHeight,
    displayMenu,
    tieKey,
    mini,
    zIndex,
  }: Props = $props();

  //kind9734の取得と検証
  const zapRequestEvent = extractKind9734(note);

  const amount: number | undefined = extractAmount(note, zapRequestEvent);
</script>

{#if !zapRequestEvent || !amount}
  <Kind9735Invalid
    {note}
    {repostable}
    {displayMenu}
    {depth}
    {tieKey}
    {mini}
    message={!zapRequestEvent
      ? "failed to get zap request event"
      : !amount
        ? "failed to get zap amount"
        : undefined}
  />{:else}
  {@const receivepub = zapRequestEvent?.tags.find((tag) => tag[0] === "p")?.[1]}
  {#if !receivepub}
    <ZappedNote
      {zapRequestEvent}
      {excludefunc}
      {amount}
      {note}
      {depth}
      {repostable}
      {maxHeight}
      {displayMenu}
      {tieKey}
      {mini}
      {zIndex}
      message={"failed to get zapped user"}
    />

    <!-- <Kind9735Invalid
      {note}
      {repostable}
      {displayMenu}
      {depth}
      {tieKey}
      {mini}
      message={"failed to get zapped user"}
    /> -->
  {:else}
    <Metadata queryKey={["metadata", receivepub]} pubkey={receivepub}>
      {#snippet loading()}
        <ZappedNote
          {zapRequestEvent}
          {excludefunc}
          {amount}
          {note}
          {depth}
          {repostable}
          {maxHeight}
          {displayMenu}
          {tieKey}
          {mini}
          {zIndex}
          message={"loading zap recipient's data..."}
        />

        <!-- <Kind9735Invalid
            {note}
            {repostable}
            {displayMenu}
            {depth}
            {tieKey}
            {mini}
            message={"loading zap recipient's data..."}
          /> -->
      {/snippet}
      {#snippet nodata()}
        <ZappedNote
          {zapRequestEvent}
          {excludefunc}
          {amount}
          {note}
          {depth}
          {repostable}
          {maxHeight}
          {displayMenu}
          {tieKey}
          {mini}
          {zIndex}
          message={"failed to get zap recipient's data."}
        />

        <!-- <Kind9735Invalid
            {note}
            {repostable}
            {displayMenu}
            {depth}
            {tieKey}
            {mini}
            message={"failed to get zap recipient's data."}
          /> -->
      {/snippet}
      {#snippet error()}
        <ZappedNote
          {zapRequestEvent}
          {excludefunc}
          {amount}
          {note}
          {depth}
          {repostable}
          {maxHeight}
          {displayMenu}
          {tieKey}
          {mini}
          {zIndex}
          message={"error to get zap recipient's data."}
        />

        <!-- <Kind9735Invalid
            {note}
            {repostable}
            {displayMenu}
            {depth}
            {tieKey}
            {mini}
            message={"error to get zap recipient's data."}
          /> -->
      {/snippet}
      {#snippet content({ metadata: receiverMetadata })}
        {#await getZapLNURLPubkey(receiverMetadata)}
          <ZappedNote
            {zapRequestEvent}
            {excludefunc}
            {amount}
            {note}
            {depth}
            {repostable}
            {maxHeight}
            {displayMenu}
            {tieKey}
            {mini}
            {zIndex}
            message={"Checking the LNURL Server's pubkey..."}
          />

          <!-- <Kind9735Invalid
            {note}
            {repostable}
            {displayMenu}
            {depth}
            {tieKey}
            {mini}
            message={"Checking the LNURL Server's pubkey..."}
          /> -->
        {:then isValidEvent9735}
          {#if !isValidEvent9735.pub}
            <ZappedNote
              {zapRequestEvent}
              {excludefunc}
              {amount}
              {note}
              {depth}
              {repostable}
              {maxHeight}
              {displayMenu}
              {tieKey}
              {mini}
              {zIndex}
              message={isValidEvent9735.error}
            />

            <!-- <Kind9735Invalid
              {note}
              {repostable}
              {displayMenu}
              {depth}
              {tieKey}
              {mini}
              message={isValidEvent9735.error}
            /> -->
          {:else}
            <ZappedNote
              {zapRequestEvent}
              {excludefunc}
              {amount}
              {note}
              {depth}
              {repostable}
              {maxHeight}
              {displayMenu}
              {tieKey}
              {mini}
              {zIndex}
            />
          {/if}
        {/await}
      {/snippet}
    </Metadata>{/if}{/if}
