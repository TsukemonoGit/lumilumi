export const relayRegex = /^wss?:\/\/\S+$/g;
//export const nip33RegexG = /^([0-9]{1,9}):([0-9a-fA-F]{64}):(.*)$/g;
export const nip33Regex = /^([0-9]{1,9}):([0-9a-fA-F]{64}):(.*)$/;
export const nip19Regex =
  /nostr:(((npub|nsec|nprofile|naddr|nevent|note)1[023456789acdefghjklmnpqrstuvwxyz]{58,})|(nrelay1[023456789acdefghjklmnpqrstuvwxyz]{20,}))/g;

export const urlRegex = /(https?:\/\/+[^\s"'<`\]]+[^\s"'<`:\].]+)/g;
export const emojiRegex = /(:[^:\s]+:)/g;
export const hashtagRegex = /(?<=^|\s)#(?<hashtag>[\p{Letter}\p{Number}_]+)/gu; //(?<hashtag>...) は、名前付きキャプチャグループ
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

export function formatAbsoluteDate(unixTime: number): string {
  const date = new Date(unixTime * 1000);
  const now = new Date();

  const sameYear = date.getFullYear() === now.getFullYear();
  const sameMonth = sameYear && date.getMonth() === now.getMonth();
  const sameDay = sameMonth && date.getDate() === now.getDate();

  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  if (!sameDay) {
    options.month = "2-digit";
    options.day = "2-digit";
  }

  if (!sameYear) {
    options.year = "numeric";
  }

  return date.toLocaleString([], options);
}
