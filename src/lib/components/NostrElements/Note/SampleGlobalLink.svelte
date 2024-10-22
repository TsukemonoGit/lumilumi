<script lang="ts">
  import { page } from "$app/stores";
</script>

<div>
  <div class="font-bold mt-2">sample global timeline link:</div>
  <ul>
    <li>
      <a class="underline text-magnum-400 :opacity-75" href={`/relay/nos.lol`}
        >{`${$page.url.origin}/relay/nos.lol`}</a
      >
    </li>
    <li>
      <a class="underline text-magnum-400 :opacity-75" href={`/relay/yabu.me`}
        >{`${$page.url.origin}/relay/yabu.me`}</a
      > ( japan only relay )
    </li>
    <li>
      <a
        class="underline text-magnum-400 :opacity-75"
        href={`/relay/catstrr.swarmstr.com/`}
        >{`${$page.url.origin}/relay/catstrr.swarmstr.com/`}</a
      > (cat only relay)
    </li>
  </ul>
</div>
