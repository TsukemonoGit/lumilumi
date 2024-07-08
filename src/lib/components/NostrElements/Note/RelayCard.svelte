<script lang="ts">
  import { showImg } from "$lib/stores/stores";
  import { type Nip11 } from "nostr-typedef";
  import { Nip11Registry } from "rx-nostr";

  export let url: string;
  export let write: boolean;
  export let read: boolean;

  $: httpsUrl = url.startsWith("wss://")
    ? url.replace(/^wss:/, "https:")
    : url.replace(/^ws:/, "http:");

  const relayInfoFun = async (): Promise<Nip11.RelayInfo | undefined> => {
    const relayInfo = Nip11Registry.get(url);
    if (relayInfo) {
      //	console.log(relayInfo);
      return relayInfo;
    } else {
      const fetchInfo = await Nip11Registry.fetch(url);
      //	console.log(fetchInfo);
      return fetchInfo;
    }
  };
  let imageLoaded = true;
</script>

{#await relayInfoFun()}
  {url} read:{read} write:{write}
{:then relayInfo}
  {#if !relayInfo}
    {url} read:{read} write:{write}
  {:else}
    <!--ICON そのた-->
    <div class="pl-1 grid grid-cols-[auto_1fr] gap-1.5">
      <div
        class="w-12 h-12 rounded-full variant-filled-surface text-center flex items-center justify-center text-lg"
      >
        {#if $showImg && relayInfo.icon}
          <img
            loading="lazy"
            src={relayInfo.icon}
            class="w-12 h-12 rounded-full"
            alt="relay Icon"
          />
        {:else if $showImg && imageLoaded}
          <img
            loading="lazy"
            src={httpsUrl + "favicon.ico"}
            on:error={() => (imageLoaded = false)}
            class="w-12 h-12 rounded-full"
            alt="relay favicon"
          />
        {:else if relayInfo.name}
          {relayInfo.name[0]}
        {/if}
      </div>
      <!-- title-description -->
      <div class="grid grid-rows-[auto_auto] gap-1">
        <div>
          <div class="flex items-center gap-1">
            <!--titleとR/W-->
            <div class=" h5">{relayInfo.name}</div>

            <div
              class="h-fit border border-primary-400 break-keep text-xs font-bold w-8 text-center"
            >
              {#if read && write}
                RW
              {:else if read}
                R
              {:else}
                W
              {/if}
            </div>
          </div>
          <div class="flex w-fit">
            <a
              class="anchor"
              href={httpsUrl}
              rel="external noreferrer"
              target="_blank">{url}</a
            >
          </div>
        </div>
        <!--description-->
        <div class="">
          <div>{relayInfo.description}</div>
          {#if relayInfo.supported_nips}
            <div class="w-full">
              NIPs:
              {#each relayInfo.supported_nips as nip}
                <a
                  class="px-1 whitespace-nowrap"
                  rel="external noreferrer"
                  target="_blank"
                  href={"https://github.com/nostr-protocol/nips/blob/master/" +
                    nip.toString().padStart(2, "0") +
                    ".md"}>{nip}</a
                >
              {/each}
            </div>
          {/if}
          {#if relayInfo.limitation?.max_content_length}
            <div>
              Max content length: <span class="break-keep"
                >{new Intl.NumberFormat().format(
                  relayInfo.limitation.max_content_length
                )}</span
              >
            </div>
          {/if}
          {#if relayInfo.limitation?.max_event_tags}
            <div>
              Max event tags: <span class="break-keep"
                >{new Intl.NumberFormat().format(
                  relayInfo.limitation.max_event_tags
                )}</span
              >
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
{/await}
