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
