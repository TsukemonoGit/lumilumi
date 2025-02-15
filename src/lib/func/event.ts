import type { Profile } from "$lib/types";

import * as Nostr from "nostr-typedef";
import { hexRegex, nip33Regex } from "./regex";
import type { Ogp } from "./ogp";

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
  tags: string[][],
  kind: number
): { replyTag: string[] | undefined; replyUsers: string[] } => {
  if (kind !== 1111) {
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

    return {
      replyUsers: users,
      replyTag:
        reply ?? root ?? IDs.length > 0 ? IDs[IDs.length - 1] : undefined,
    };
  } else {
    //comment NIP-22 https://github.com/nostr-protocol/nips/blob/master/22.md
    const users = Array.from(
      new Set(
        tags.reduce((acc, [tag, value]) => {
          if ((tag === "p" || tag === "P") && hexRegex.test(value)) {
            acc.push(value);
          }
          return acc;
        }, [] as string[])
      )
    );

    const ID = tags?.find(
      (tag) =>
        (tag[0] === "e" && hexRegex.test(tag[1])) ||
        (tag[0] === "a" && nip33Regex.test(tag[1])) ||
        tag[0] === "i"
    );
    if (ID) {
      return {
        replyUsers: users,
        replyTag: ID,
      };
    }
    const parentID = tags?.find(
      (tag) =>
        (tag[0] === "E" && hexRegex.test(tag[1])) ||
        (tag[0] === "A" && nip33Regex.test(tag[1])) ||
        tag[0] === "I"
    );

    return {
      replyUsers: users,
      replyTag: parentID ? parentID : undefined,
    };
  }
};

export function extractZappedId(tags: string[][]): {
  tag: string[];
} {
  const eTag = tags?.find(
    (tag) =>
      (tag[0] === "e" && hexRegex.test(tag[1])) ||
      (tag[0] === "a" && nip33Regex.test(tag[1]))
  );
  //console.log(eTag);
  return {
    tag: eTag ? (eTag as string[]) : [],
  };
}

// 一致するIDを1つだけ削除するヘルパー関数
export function removeFirstMatchingId(
  viewEventIds: string[][],
  tag: string[] | undefined
): string[][] {
  if (!tag) return viewEventIds; // tagがundefinedの場合は何もしない

  const index = viewEventIds.findIndex(
    (item: string[]) => item[0] === tag[0] && item[1] === tag[1]
  );
  if (index !== -1) {
    viewEventIds.splice(index, 1); // 一致する1つだけ削除
  }
  return viewEventIds;
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
