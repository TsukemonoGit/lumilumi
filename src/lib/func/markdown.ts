import type { Token } from "markdown-it/index.js";
import { numberQuoteEncode, numberRegex, type Part } from "./content";
import { nip19Regex, urlRegex, nipRegex } from "./util";

// トークンのタイプから `_open` または `_close` を抽出
function getTokenTypeWithoutSuffix(token: Token): string {
  return token.type.endsWith("_open")
    ? token.type.replace("_open", "")
    : token.type.replace("_close", "");
}

// トークンのペアを処理する関数
function processTokenPair(
  tokens: Token[],
  startIndex: number,
  openType: string,
  result: Token[]
): number {
  const tokenCount = tokens.length;
  const tempObj: Token = {
    type: openType,
    tag: tokens[startIndex].tag,
    attrs: tokens[startIndex].attrs,
    map: null,
    nesting: 0,
    level: tokens[startIndex].level,
    children: [],
    content: "", // 初期化
    markup: tokens[startIndex].markup,
    info: tokens[startIndex].info,
    meta: tokens[startIndex].meta,
    block: tokens[startIndex].block,
    hidden: tokens[startIndex].hidden,
    attrIndex: tokens[startIndex].attrIndex,
    attrPush: tokens[startIndex].attrPush,
    attrSet: tokens[startIndex].attrSet,
    attrGet: tokens[startIndex].attrGet,
    attrJoin: tokens[startIndex].attrJoin,
  };

  let accumulatedContent = "";
  let openCount = 0;
  let foundClose = false;
  let i = startIndex + 1;

  while (i < tokenCount) {
    const token = tokens[i];

    if (token.type === `${openType}_open`) {
      openCount++;
      accumulatedContent += token.content + " ";
      tempObj.children?.push(token);
    } else if (token.type === `${openType}_close`) {
      if (openCount > 0) {
        openCount--;
        accumulatedContent += token.content + " ";
        tempObj.children?.push(token);
      } else {
        tempObj.content = accumulatedContent.trim();
        result.push(tempObj);
        foundClose = true;
        break;
      }
    } else {
      accumulatedContent += token.content + " ";
      tempObj.children?.push(token);
    }

    i++;
  }

  if (!foundClose) {
    result.push({
      type: tokens[startIndex].type,
      tag: tokens[startIndex].tag,
      attrs: tokens[startIndex].attrs,
      map: tokens[startIndex].map,
      nesting: tokens[startIndex].nesting,
      level: tokens[startIndex].level,
      children: tokens[startIndex].children,
      content: tokens[startIndex].content,
      markup: tokens[startIndex].markup,
      info: tokens[startIndex].info,
      meta: tokens[startIndex].meta,
      block: tokens[startIndex].block,
      hidden: tokens[startIndex].hidden,
      attrIndex: tokens[startIndex].attrIndex,
      attrPush: tokens[startIndex].attrPush,
      attrSet: tokens[startIndex].attrSet,
      attrGet: tokens[startIndex].attrGet,
      attrJoin: tokens[startIndex].attrJoin,
    });
  }

  return i;
}

// トークン配列を変換する関数
export function transformTokens(tokens: Token[]): Token[] {
  const result: Token[] = [];
  const tokenCount = tokens.length;
  let i = 0;

  while (i < tokenCount) {
    const token = tokens[i];

    if (token.type.endsWith("_open")) {
      const openType = getTokenTypeWithoutSuffix(token);
      i = processTokenPair(tokens, i, openType, result);
    } else if (token.type.endsWith("_close")) {
      result.push({
        type: token.type,
        tag: token.tag,
        attrs: token.attrs,
        map: token.map,
        nesting: token.nesting,
        level: token.level,
        children: token.children,
        content: token.content,
        markup: token.markup,
        info: token.info,
        meta: token.meta,
        block: token.block,
        hidden: token.hidden,
        attrIndex: token.attrIndex,
        attrPush: token.attrPush,
        attrSet: token.attrSet,
        attrGet: token.attrGet,
        attrJoin: token.attrJoin,
      });
    } else {
      result.push(token);
    }

    i++;
  }

  return result;
}
