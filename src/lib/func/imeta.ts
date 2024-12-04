export interface Imeta {
  url?: string;
  ox?: string;
}

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

export const reverseConvertMetaTags = (
  convertedTags: string[] | undefined
): Imeta | undefined => {
  if (
    !convertedTags ||
    convertedTags.length === 0 ||
    convertedTags[0] !== "imeta"
  ) {
    return undefined;
  }

  const originalTags = convertedTags.slice(1).reduce((be, tag) => {
    const [key, ...rest] = tag.split(" ");
    return { ...be, [key]: rest.join(" ") };
  }, {});

  return originalTags;
};
