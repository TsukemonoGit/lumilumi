import { decode } from "light-bolt11-decoder";
import * as Nostr from "nostr-typedef";

export const repostedId = (
  tags: string[][]
): { tag: string[] | undefined; kind: number | undefined } => {
  const kindtag = tags.find((tag) => tag[0] === "k");
  const kind = kindtag ? Number(kindtag[1]) : undefined;
  return {
    tag: tags
      .slice()
      .reverse()
      .find((tag) => tag[0] === "e" || tag[0] === "a"),
    kind: kind,
  };
};

export const replyedEvent = (
  tags: string[][]
): { replyID: string | undefined; replyUsers: string[] } => {
  const users = tags.reduce((acc, [tag, value]) => {
    if (tag === "p") {
      return [...acc, value];
    } else {
      return acc;
    }
  }, []);
  const IDs = tags?.filter((tag) => tag[0] === "e");
  const root = IDs?.find((item) => item.length > 3 && item[3] === "root");
  const reply = IDs?.find((item) => item.length > 3 && item[3] === "reply");
  //  console.log(root?.[1]);
  return {
    replyUsers: users,
    replyID: reply
      ? reply[1]
      : root
      ? root[1]
      : IDs.length > 0
      ? IDs[IDs.length - 1][1]
      : undefined,
  };
};

export function extractZappedId(tags: string[][]): {
  kind: number | undefined;
  tag: string[];
} {
  const eTag = tags?.find((tag) => tag[0] === "e");
  return {
    kind: undefined,
    tag: eTag ? (eTag as string[]) : [],
  };
}

//https://scrapbox.io/nostr/NIP-57
export function extractAmount(
  note: Nostr.Event,
  zapRequestEvent: Nostr.Event | undefined
): number | undefined {
  //bolt11 tag を持たなければならない
  const bolt11Tag = note.tags.find((tag) => tag[0] === "bolt11");
  //console.log(bolt11Tag);
  if (!bolt11Tag || bolt11Tag.length <= 1) {
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
          return undefined;
        }
      }
      if (amountSection) {
        return Math.floor(Number(amountSection) / 1000);
      }
    }
  } catch (error) {
    console.error("Error decoding bolt11 tag:", error);
    return;
  }
}