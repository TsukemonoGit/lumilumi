<script lang="ts">
  import {
    loginUser,
    nowProgress,
    toastSettings,
    uploader,
  } from "$lib/stores/stores";
  import Dialog from "../Elements/Dialog.svelte";
  import { promisePublishEvent, usePromiseReq } from "$lib/func/nostr";
  import { latest } from "rx-nostr";
  import { pipe } from "rxjs";

  import { getQueryRelays, setTheme } from "$lib/func/settings";
  import type { EventPacket, DefaultRelayConfig } from "rx-nostr";
  import type {
    Kind30078LumiSetting,
    Kind30078LumiSettingObj,
    LumiSetting,
    Theme,
  } from "$lib/types";
  import { now } from "rx-nostr/src";
  import type { EventParameters } from "nostr-typedef";
  import * as Nostr from "nostr-typedef";
  import { datetime } from "$lib/func/util";
  import AlertDialog from "../Elements/AlertDialog.svelte";
  import { t as _ } from '@konemono/svelte5-i18n';
  import { writable, type Writable } from "svelte/store";
  import { showBanner, timelineFilter } from "$lib/stores/globalRunes.svelte";

  interface Props {
    settingsChanged: () => boolean;
    saveLumiSettings: () => void;
    settings: LumiSetting;
  }
  let {
    settingsChanged,
    saveLumiSettings,
    settings = $bindable(),
  }: Props = $props();

  let kind30078LumiSettings: Kind30078LumiSetting[] = $state.raw([]);
  let localLumisetting: Kind30078LumiSettingObj;

  // svelte-ignore non_reactive_update
  let dialogOpen: Writable<boolean> = writable(false);
  // svelte-ignore non_reactive_update
  let alertdialogOpen: (bool: boolean) => void = () => {};

  async function handleClickUpDownload() {
    if (settingsChanged()) {
      //編集中の項目があります。さきにsave（またはリセット）してください
      $toastSettings = {
        title: "Error",
        description:
          "編集中の項目があります。さきにsave（またはリセット）してください",
        color: "bg-red-500",
      };
      return;
    }

    //localのデータを整形 nameは未定？

    localLumisetting = {
      lumiSetting: settings,
      showBanner: showBanner.get(),
      theme: localStorage.getItem("theme") ?? "system",
      timelineFilter: timelineFilter.get(),
      uploader: $uploader,
    };

    //オープンするときに最新の30078確認する
    $nowProgress = true;
    await get30078();
    //set30078(event);

    $nowProgress = false;
    $dialogOpen = true;
  }
  // onMount(() => {});
  // function handleClickDownload(
  //   event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
  // ) {}

  let saveName: string = $state("");

  async function get30078() {
    const relays = await getQueryRelays($loginUser);
    console.log(relays);
    if (!relays) {
      $toastSettings = {
        title: "Error",
        description: "relay list not found",
        color: "bg-red-500",
      };
      return;
    }
    const kind30078: EventPacket[] = await usePromiseReq(
      {
        filters: [
          {
            kinds: [30078],
            authors: [$loginUser],
            limit: 1,
            "#d": ["lumi-settings"],
          },
        ],
        operator: pipe(latest()),
        req: undefined,
        initData: undefined,
      },
      relays.map(({ url, read, write }) => url)
    );
    if (kind30078.length > 0) {
      set30078(kind30078[0].event);
    }
  }

  const handleClickSave = async () => {
    saveName = saveName.trim();
    if (saveName === "") {
      $toastSettings = {
        title: "Error",
        description: "Name is required.",
        color: "bg-red-500",
      };
      return;
    }

    alertdialogOpen?.(true);
  };

  const handleClickPublish = async () => {
    alertdialogOpen?.(false);
    const sameIndex = kind30078LumiSettings.findIndex(
      (data) => data.name === saveName
    );
    const addData: Kind30078LumiSetting = {
      name: saveName,
      ...localLumisetting,
      created_at: now(),
    };
    const newLumiSettings =
      sameIndex === -1
        ? [...kind30078LumiSettings, addData]
        : kind30078LumiSettings.map((data) => {
            if (data.name !== saveName) {
              return data;
            } else {
              return addData;
            }
          });

    const result = await publishSettings(newLumiSettings);
    if (result) {
      saveName = "";
      $toastSettings = {
        title: "Success",
        description: "Success to Save",
        color: "bg-green-500",
      };
    }
  };

  const set30078 = (ev: Nostr.Event) => {
    console.log(ev);
    try {
      kind30078LumiSettings = JSON.parse(ev.content);
      console.log(kind30078LumiSettings);
      // kind30078LumiSettings が配列かどうかを確認し、配列でない場合は空の配列に設定
      if (!Array.isArray(kind30078LumiSettings)) {
        kind30078LumiSettings = [];
      }
    } catch (error) {
      console.log("Error parsing event content:", error);
      kind30078LumiSettings = []; // エラー時には空の配列にフォールバック
    }
  };

  const handleClickDelete = async (name: string) => {
    const newData = kind30078LumiSettings.filter((data) => data.name !== name);

    const result = await publishSettings(newData);

    if (result) {
      saveName = "";
      $toastSettings = {
        title: "Success",
        description: "Success to Delete",
        color: "bg-green-500",
      };
    }
  };

  const handleClickLoad = (name: string) => {
    const loadData: Kind30078LumiSetting | undefined =
      kind30078LumiSettings.find((data) => data.name === name);
    if (!loadData) {
      $toastSettings = {
        title: "Error",
        description: "failed to load", //編集中の項目があります。さきにsave（またはリセット）してください
        color: "bg-red-500",
      };
      return;
    }
    $nowProgress = true;

    if (loadData.showBanner) {
      showBanner.set(loadData.showBanner);
      localStorage?.setItem("showBanner", loadData.showBanner.toString());
    }

    if (loadData.theme) {
      setTheme(loadData.theme as Theme);

      localStorage?.setItem("theme", loadData.theme);
    }

    if (loadData.timelineFilter) {
      timelineFilter.set(loadData.timelineFilter);
      localStorage?.setItem(
        "timelineFilter",
        JSON.stringify(loadData.timelineFilter)
      );
    }

    if (loadData.uploader) {
      $uploader = loadData.uploader;
      if (loadData.uploader) {
        localStorage?.setItem("uploader", loadData.uploader);
      }
    }
    if (loadData.lumiSetting) {
      settings = loadData.lumiSetting;
      saveLumiSettings();
    }
    $nowProgress = false;
  };

  async function publishSettings(
    lumiData: Kind30078LumiSetting[]
  ): Promise<boolean> {
    try {
      $nowProgress = true;

      const str = JSON.stringify(lumiData);
      const evePara: EventParameters = {
        content: str,
        tags: [["d", "lumi-settings"]],
        kind: 30078,
        pubkey: $loginUser,
      };
      const relays = await getQueryRelays($loginUser);
      const writeRelays = configToWrite(relays);
      const { event: ev, res: res } = await promisePublishEvent(
        evePara,
        writeRelays
      );
      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
      console.log(isSuccess);
      if (isSuccess.length <= 0) {
        //しっぱい
        $toastSettings = {
          title: "Error",
          description: "Failed to publish",
          color: "bg-red-500",
        };
        $nowProgress = false;

        return false;
      }
      set30078(ev);

      $nowProgress = false;
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  const configToWrite = (
    relays: DefaultRelayConfig[] | undefined
  ): string[] | undefined => {
    return !relays
      ? undefined
      : relays.reduce((cur, { url, write }) => {
          if (write) {
            return [...cur, url];
          }
          return cur;
        }, [] as string[]); // 戻り値の配列はstring型のみに変更
  };
</script>

<button
  disabled={$nowProgress}
  class="h-10 rounded-md bg-magnum-600 px-3 py-1 font-bold text-magnum-100 hover:opacity-75 active:opacity-50 disabled:opacity-25"
  onclick={handleClickUpDownload}>{$_("settings.load.title")}</button
>

<Dialog bind:open={dialogOpen} id={"30078"}>
  {#snippet main()}
    <h2 class="text-magnum-300 text-lg font-bold">
      {$_("settings.load.title2")}
    </h2>
    <div
      class="w-full h-[calc(min(400px,60vh))] overflow-x-hidden p-1 my-1 flex flex-col"
    >
      <!-- 上部セクション -->
      <div>
        <div class="flex gap-1 items-center">
          <input
            type="text"
            class="rounded-md h-8 px-2 border border-magnum-300 disabled:opacity-25"
            maxlength="32"
            placeholder="name"
            bind:value={saveName}
          /><button
            class="h-8 px-2 rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
            onclick={handleClickSave}>SAVE</button
          >
        </div>
        <p class="text-neutral-500 text-sm">
          {$_("settings.load.description2")}
        </p>
      </div>

      <!-- 中央セクション：テーブル部分 -->
      <div class="flex-1 min-h-0 my-2">
        <div class="rounded-md border border-magnum-600 h-full overflow-auto">
          <table>
            <thead>
              <tr>
                <th>name</th><th>created_at</th><th>load</th><th>delete</th>
              </tr></thead
            >
            <tbody>
              {#each kind30078LumiSettings as setting}
                <tr
                  ><td>{setting.name}</td>
                  <td
                    ><time datetime={datetime(setting.created_at)}
                      >{new Date(
                        setting.created_at * 1000
                      ).toLocaleString()}</time
                    ></td
                  >
                  <td
                    ><button
                      class="h-6 px-2 rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
                      onclick={() => handleClickLoad(setting.name)}>LOAD</button
                    ></td
                  >
                  <td
                    ><button
                      class="h-6 px-2 rounded-md bg-magnum-400 font-medium text-magnum-800 hover:opacity-75 active:opacity-50"
                      onclick={() => handleClickDelete(setting.name)}
                      >DELETE</button
                    ></td
                  >
                </tr>{/each}
            </tbody>
          </table>
          {#if kind30078LumiSettings.length <= 0}
            <p class="text-center">no data</p>
          {/if}
        </div>
      </div>

      <!-- 下部セクション：固定表示する説明文 -->
      <div class="mt-auto">
        <p class="text-neutral-500 text-sm">
          {$_("settings.load.description")}
        </p>
      </div>
    </div>
  {/snippet}
</Dialog>

<AlertDialog
  bind:openDialog={alertdialogOpen}
  onClickOK={handleClickPublish}
  title={`SAVE`}
  okButtonName="OK"
  >{#snippet main()}
    {#if kind30078LumiSettings.find((data) => data.name === saveName)}
      <p class="font-bold py-2">name: {saveName}</p>
      <p>
        {$_("settings.save.rewrite")}
      </p>
    {:else}
      <p class="font-bold py-2">name: {saveName}</p>
      <p>{$_("settings.save.new")}</p>
    {/if}
  {/snippet}</AlertDialog
>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    font-size: 16px;
    text-align: left;
    table-layout: auto;
  }

  th,
  td {
    border-bottom: 1px solid rgb(var(--color-magnum-600));
    height: 2rem;
  }
  td {
    padding: 0px 4px;
    border-bottom: 1px solid rgb(var(--color-magnum-600));
  }

  th {
    text-align: center;
    border-bottom: 2px solid rgb(var(--color-magnum-600));
  }
  /* 最後から2番目の列の幅を指定 */
  th:nth-last-child(2),
  td:nth-last-child(2) {
    text-align: center;
  }
  /* 最後から2番目の列の幅を指定 */
  th:nth-last-child(3),
  td:nth-last-child(3) {
    text-align: center;
  }
  /* delete 列の幅を指定 */
  th:last-child,
  td:last-child {
    text-align: center;
  }
</style>
