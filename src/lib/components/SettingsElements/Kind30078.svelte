<script lang="ts">
  import { nowProgress } from "$lib/stores/stores";

  // 設定をアップロード

  // 設定をダウンロード
  // //設定ごとにd作ったら消したりしにくくなるから一個にまとめよ
  // tags:["d","lumi-settings"]
  // [
  //   {
  //   name:"lumi1",
  // lumiSetting:string,
  // showBanner:string,
  // theme:string,
  // timelineFilter:string
  // },
  // {name:"lumi2",
  // lumiSetting:string,
  // showBanner:string,
  // theme:string,
  // timelineFilter:string
  // }
  // ]

  function handleClickUpload(
    event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
  ) {}

  function handleClickDownload(
    event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
  ) {}
</script>

<button
  disabled={$nowProgress}
  class="h-10 rounded-md bg-magnum-600 px-3 py-1 font-bold text-magnum-100 hover:opacity-75 active:opacity-50 disabled:opacity-25"
  on:click={handleClickUpload}
  >現在の設定をリレーにアップロード/ダウンロード</button
>
<button
  disabled={$nowProgress}
  class="h-10 rounded-md bg-magnum-600 px-3 py-1 font-bold text-magnum-100 hover:opacity-75 active:opacity-50 disabled:opacity-25"
  on:click={handleClickDownload}>リレーから設定を読み込む</button
>
