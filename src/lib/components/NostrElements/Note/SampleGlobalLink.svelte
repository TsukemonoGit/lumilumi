<script lang="ts">
  import { page } from "$app/stores";
</script>

<div>
  <div class="font-bold mt-2">sample global timeline link:</div>
  <ul>
    <li>
      <a
        class="underline text-magnum-400 :opacity-75"
        href={`./global?relay=wss://nos.lol`}
        >{`${$page.url.origin}/global?relay=wss://nos.lol`}</a
      >
    </li>
    <li>
      <a
        class="underline text-magnum-400 :opacity-75"
        href={`${$page.url.origin}/global?relay=wss://yabu.me`}
        >{`${$page.url.origin}/global?relay=wss://yabu.me`}</a
      > ( japan only relay )
    </li>
    <li>
      <a
        class="underline text-magnum-400 :opacity-75"
        href={`./global?relay=wss://catstrr.swarmstr.com/`}
        >{`${$page.url.origin}/global?relay=wss://catstrr.swarmstr.com/`}</a
      > (cat only relay)
    </li>
  </ul>
</div>
