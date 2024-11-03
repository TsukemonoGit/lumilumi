import type { Profile } from "$lib/types";
import { decode } from "light-bolt11-decoder";
import * as Nostr from "nostr-typedef";
import { hexRegex, nip33Regex } from "./util";
import type { Ogp } from "./ogp";

//https://scrapbox.io/nostr/NIP-57
export function extractAmount(
  note: Nostr.Event,
  zapRequestEvent: Nostr.Event | undefined
): number | undefined {
  //bolt11 tag を持たなければならない
  const bolt11Tag = note.tags.find((tag) => tag[0] === "bolt11");
  //console.log(bolt11Tag);
  if (!bolt11Tag || bolt11Tag.length <= 1) {
    console.log("zap bolt11Tag error");
    return;
  }
  try {
    const decoded = decode(bolt11Tag[1]);
    //console.log(decoded);
    if (decoded) {
      const amountSection = decoded.sections.find(
        (section) => section.name === "amount"
      )?.value;
      //  console.log("zapRequestEvent", zapRequestEvent);
      // console.log("amountSection", amountSection);

      const requestAmount = zapRequestEvent?.tags.find(
        (tag) => tag[0] === "amount"
      )?.[1];
      // console.log("requestAmount", requestAmount);
      //`zapレシート`の`bolt11`タグに含まれる`invoiceAmount`は（存在する場合には）`zapリクエスト`の`amount`タグと等しくなければならない
      //https://github.com/nostr-protocol/nips/blob/master/57.md
      //ある場合にのみイコールなのが必須
      if (requestAmount) {
        if (amountSection !== requestAmount) {
          console.log("zap amount error", amountSection, requestAmount);
          return undefined;
        }
      }
      //amountSectionの値がザップの値
      if (amountSection) {
        return Math.floor(Number(amountSection) / 1000);
      }
    }
  } catch (error) {
    console.error("Error decoding bolt11 tag:", error);
    return;
  }
}

export const repostedId = (
  tags: string[][]
): { tag: string[] | undefined; kind: number | undefined } => {
  const kindtag = tags.find((tag) => tag[0] === "k");
  const kind = kindtag ? Number(kindtag[1]) : undefined;
  return {
    tag: tags
      .slice()
      .reverse()
      .find(
        (tag) =>
          (tag[0] === "e" && hexRegex.test(tag[1])) ||
          (tag[0] === "a" && nip33Regex.test(tag[1]))
      ),
    kind: kind,
  };
};

export const replyedEvent = (
  tags: string[][]
): { replyTag: string[] | undefined; replyUsers: string[] } => {
  const users = tags.reduce((acc, [tag, value]) => {
    if (tag === "p" && hexRegex.test(value)) {
      return [...acc, value];
    } else {
      return acc;
    }
  }, []);
  const IDs = tags?.filter(
    (tag) =>
      (tag[0] === "e" && hexRegex.test(tag[1])) ||
      (tag[0] === "a" && nip33Regex.test(tag[1]))
  );
  const root = IDs?.find((item) => item.length > 3 && item[3] === "root");
  const reply = IDs?.find((item) => item.length > 3 && item[3] === "reply");
  //  console.log(root?.[1]);
  return {
    replyUsers: users,
    replyTag: reply ?? root ?? IDs.length > 0 ? IDs[IDs.length - 1] : undefined,
  };
};

export function extractZappedId(tags: string[][]): {
  kind: number | undefined;
  tag: string[];
} {
  const eTag = tags?.find(
    (tag) =>
      (tag[0] === "e" && hexRegex.test(tag[1])) ||
      (tag[0] === "a" && nip33Regex.test(tag[1]))
  );
  return {
    kind: undefined,
    tag: eTag ? (eTag as string[]) : [],
  };
}

// 一致するIDを1つだけ削除するヘルパー関数
export function removeFirstMatchingId(
  viewEventIds: string[][],
  tag: string[] | undefined
) {
  if (!tag) return; // tagがundefinedの場合は何もしない

  const index = viewEventIds.findIndex(
    (item: string[]) => item[0] === tag[0] && item[1] === tag[1]
  );
  if (index !== -1) {
    viewEventIds.splice(index, 1); // 一致する1つだけ削除
  }
}

export const getProfile = (
  ev: Nostr.Event | undefined
): Profile | undefined => {
  if (!ev) return undefined;
  try {
    return JSON.parse(ev.content);
  } catch {
    return undefined;
  }
};

export function latestList(list: Nostr.Event[]): Nostr.Event[] {
  //key値 `${list[i].kind}:${list[i].pubkey}:${list[i].tags.find((tag)=>tag[0]==="d"&&tag.length>1)?.[1]}`

  //キー値が同じものはlist[i].created_atが最新のものを採用する

  const map = list.reduce((acc, event) => {
    const key = `${event.kind}:${event.pubkey}:${
      event.tags.find((tag) => tag[0] === "d" && tag.length > 1)?.[1]
    }`;

    // 既存のイベントが無い、もしくは現在のイベントがより新しい場合に更新
    if (!acc.has(key) || event.created_at > acc.get(key)!.created_at) {
      acc.set(key, event);
    }

    return acc;
  }, new Map<string, Nostr.Event>());

  return Array.from(map.values());
}

export const get31990Ogp = (
  ev: Nostr.Event
): { ogp: Ogp; url: string } | undefined => {
  try {
    const data = JSON.parse(ev.content);
    return {
      ogp: {
        title: data.name,
        image: data.banner,
        description: data.about,
        favicon: data.picture,
      } as Ogp,
      url: data.website,
    };
  } catch (error) {
    return undefined;
  }
};
