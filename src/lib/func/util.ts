import type { Profile } from "$lib/types";
import * as Nostr from "nostr-typedef";
import { readServerConfig, type FileUploadResponse } from "nostr-tools/nip96";
import { getToken } from "nostr-tools/nip98";
import { uploadFile } from "./upload";
export const nip50relays = [
  "wss://search.nos.today",
  "wss://relay.noswhere.com",
  "wss://bostr.nokotaro.com",
];

export const mediaUploader = [
  "https://nostrcheck.me",
  "https://nostr.build",
  "https://void.cat",
  "https://files.sovbit.host",
  "https://nostpic.com",
  "https://yabu.me",
];
//https://api.nostr.watch/v1/nip/50
export const relayRegex = /^wss?:\/\/\S+$/g;
//export const nip33RegexG = /^([0-9]{1,9}):([0-9a-fA-F]{64}):(.*)$/g;
export const nip33Regex = /^([0-9]{1,9}):([0-9a-fA-F]{64}):(.*)$/;
export const nip19Regex =
  /nostr:(((npub|nsec|nprofile|naddr|nevent|note)1[023456789acdefghjklmnpqrstuvwxyz]{58,})|(nrelay1[023456789acdefghjklmnpqrstuvwxyz]{20,}))/g;

export const urlRegex = /(https?:\/\/+[^\s"'<`\]]+[^\s"'<`:\].]+)/g;
export const emojiRegex = /(:[^:\s]+:)/g;
//export const hashtagRegex = /(?<=^|\s)#(?<hashtag>[\p{Letter}\p{Number}_]+)/gu; //(?<hashtag>...) は、名前付きキャプチャグループ
export const hashtagRegex =
  /#(?<hashtag>[a-zA-Z\p{XID_Continue}\p{Extended_Pictographic}\p{Emoji_Component}_+-][^#﹟＃\s]+)/gu; //#﹟＃ってかいてあるけど#だけでよくない？https://unicode.org/reports/tr31/#R8-1
export const npubRegex = /^npub\w{59}$/;
export const nipRegex = /NIP-([0-9]{2,})/g;

export const LUD06Regex = /^(LNURL1|lnurl1)[AC-HJ-NP-Z02-9]+$/;
export const LUD16Regex = /^[-_a-zA-Z0-9.]+@[-a-zA-Z0-9.]+$/;

export const profile = (ev: Nostr.Event | undefined): Profile | undefined => {
  if (!ev) {
    return undefined;
  }
  try {
    return JSON.parse(ev.content);
  } catch (error) {
    return undefined;
  }
};

export const splitHexColorString = (hexString: string): string[] => {
  if (hexString) {
    return hexString.match(/.{1,6}/g)?.map((segment) => `#${segment}`) || [];
  } else {
    return ["#555555"];
  }
};

// RGB 値を計算する関数
export function calculateColor(hex: string): string {
  if (!hex) {
    return "";
  }
  // 16進数文字列を2文字ずつ分割
  const hexPairs: RegExpMatchArray = hex.match(/.{1,2}/g) as RegExpMatchArray;

  const { r, g, b } = hexPairs.reduce(
    (
      acc: { r: number; g: number; b: number },
      hexPair: string,
      index: number
    ) => {
      const value = parseInt(hexPair, 16);
      if (index % 3 === 0) acc.r = (acc.r + value) % 256;
      else if (index % 3 === 1) acc.g = (acc.g + value) % 256;
      else if (index % 3 === 2) acc.b = (acc.b + value) % 256;
      return acc;
    },
    { r: 0, g: 0, b: 0 }
  );

  return `rgb(${r},${g},${b})`;
}

export function formatAbsoluteDate(
  unixTime: number,
  full: boolean = false
): string {
  const date = new Date(unixTime * 1000);
  const now = new Date();

  const sameYear = date.getFullYear() === now.getFullYear();
  const sameMonth = sameYear && date.getMonth() === now.getMonth();
  const sameDay = sameMonth && date.getDate() === now.getDate();

  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  if (full || !sameDay) {
    options.month = "2-digit";
    options.day = "2-digit";
  }

  if (full || !sameYear) {
    options.year = "numeric";
  }

  return date.toLocaleString([], options);
}

export async function filesUpload(
  files: FileList,
  uploader: string
): Promise<FileUploadResponse[]> {
  console.log(files, uploader);
  let res: FileUploadResponse[] = [];
  for (const file of files) {
    try {
      const serverConfig = await readServerConfig(uploader);
      console.log(serverConfig);
      const header = await getToken(
        serverConfig.api_url,
        "POST",
        async (e) => await (window.nostr as Nostr.Nip07.Nostr).signEvent(e),
        true
      );
      console.log(file);
      console.log(header);
      console.log(serverConfig.api_url);
      console.log(file.type);
      const response: FileUploadResponse = await uploadFile(
        file,
        serverConfig.api_url,
        header,
        { content_type: file.type }
      );
      console.log(response);
      res.push(response);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.push({
        status: "error",
        message: "Failed to upload file: " + file.name,
      } as FileUploadResponse);
    }
  }
  return res;
}
export const generateResultMessage = (isSuccess: any[], isFailed: any[]) => {
  let str = "";
  if (isSuccess.length > 0) {
    str = "OK\n";
    isSuccess.map((item) => (str += `${item.from}\n`));
    str += "\n";
  }
  if (isFailed.length > 0) {
    str += "Failed\n";
    isFailed.map((item) => `${item.from}\n`);
  }
  return str;
};

export const convertMetaTags = (event: {
  tags: [string, string][];
  content: string;
}): string[] => {
  let newTag = ["imeta"];
  event.tags.map((tag) => {
    if (tag.length > 1 && tag[1].trim() !== "") {
      newTag.push(`${tag[0]} ${tag[1]}`);
    }
  });

  return newTag;
};
