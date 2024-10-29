<script lang="ts">
  import { page } from "$app/stores";
</script>

<div>
  <div class="font-bold mt-2">sample global timeline link:</div>
  <ul>
    <li>
      <a
        class="underline text-magnum-400 :opacity-75"
        href={`/relay/${encodeURIComponent("wss://nos.lol")}`}>wss://nos.lol</a
      >
    </li>
    <li>
      <a
        class="underline text-magnum-400 :opacity-75"
        href={`/relay/${encodeURIComponent("wss://yabu.me")}`}>wss://yabu.me</a
      > ( japan only relay )
    </li>
    <li>
      <a
        class="underline text-magnum-400 :opacity-75"
        href={`/relay/${encodeURIComponent("wss://catstrr.swarmstr.com/")}`}
        >wss://catstrr.swarmstr.com/</a
      > (cat only relay)
    </li>
  </ul>
</div>
