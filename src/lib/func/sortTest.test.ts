import { sortEvents } from "nostr-tools";
import { expect, test } from "vitest";

const data = [
  {
    content:
      "nostr:npub1dv9xpnlnajj69vjstn9n7ufnmppzq3wtaaq085kxrz0mpw2jul2qjy6uhz nostr:npub1rnrnclxznfkqqu8nnpt0mwp4hj0xe005mnwjqlafaluv7n2kn80sy53aq2 nostr:npub1chunacswmcejn8ge95vzl22a2g6pd4nfchygslnt9gj9dshqcvqq5amrlj nostr:npub1whanysx54uf9tgjfeueljg3498kyru3rhwxajwuzh0nw0x0eujss9tlcjh NOTIFY sutehai nostr:npub1chunacswmcejn8ge95vzl22a2g6pd4nfchygslnt9gj9dshqcvqq5amrlj 4z",
    created_at: 1723429982,
    id: "2fb7c5b48e3f0c49e5d6789209d073061b1f79c12babf5a194f3e9106740e50c",
    kind: 42,
    pubkey: "93e68a5f7bf6d35f0cb1288160e42ecdb3396b80bb686a528199dfc5e58ceb25",
    sig: "c890e80b9346ca9b4f43cb16fdaefe6706e0f233eb621d0005d182c07ceb4daef25a6fa948991de5a2f118ea10cbeeba83e4ecc55d2ee5fc28c741f46f07ff44",
    tags: [
      [
        "e",
        "c8d5c2709a5670d6f621ac8020ac3e4fc3057a4961a15319f7c0818309407723",
        "",
        "root",
      ],
      [
        "e",
        "044ec07df2658fade16a87cd61ddbacd2a43c9c2d1486b963c1a7cdc9858dbc0",
        "",
        "mention",
      ],
      [
        "p",
        "6b0a60cff3eca5a2b2505ccb3f7133d8422045cbef40f3d2c6189fb0b952e7d4",
        "",
      ],
      [
        "p",
        "1cc73c7cc29a6c0070f39856fdb835bc9e6cbdf4dcdd207fa9eff8cf4d5699df",
        "",
      ],
      [
        "p",
        "c5f93ee20ede33299d192d182fa95d523416d669c5c8887e6b2a2456c2e0c300",
        "",
      ],
      [
        "p",
        "75fb3240d4af1255a249cf33f9223529ec41f223bb8dd93b82bbe6e799f9e4a1",
        "",
      ],
      ["nonce", "0"],
    ],
  },
  {
    content:
      "nostr:npub1whanysx54uf9tgjfeueljg3498kyru3rhwxajwuzh0nw0x0eujss9tlcjh NOTIFY tsumo nostr:npub1whanysx54uf9tgjfeueljg3498kyru3rhwxajwuzh0nw0x0eujss9tlcjh 61 3z",
    created_at: 1723429982,
    id: "91b13993dc482a96cfe409384fe24b9f0862f5883f50dcc6907bb0428348b7d0",
    kind: 42,
    pubkey: "93e68a5f7bf6d35f0cb1288160e42ecdb3396b80bb686a528199dfc5e58ceb25",
    sig: "f67afa242981376f808fbb652f0c6d477f0f72d9369071454e0655d8cd225b3f5ca50ef036f9803ade88e24c8167dd3f3915495808b5fe2b956fd57327237f86",
    tags: [
      [
        "e",
        "c8d5c2709a5670d6f621ac8020ac3e4fc3057a4961a15319f7c0818309407723",
        "",
        "root",
      ],
      [
        "e",
        "044ec07df2658fade16a87cd61ddbacd2a43c9c2d1486b963c1a7cdc9858dbc0",
        "",
        "mention",
      ],
      [
        "p",
        "75fb3240d4af1255a249cf33f9223529ec41f223bb8dd93b82bbe6e799f9e4a1",
        "",
      ],
    ],
  },
  {
    content:
      ":mahjong_m2::mahjong_m3::mahjong_m4::mahjong_m5::mahjong_s1::mahjong_s2::mahjong_s5::mahjong_s5::mahjong_s6::mahjong_s8::mahjong_white::mahjong_green::mahjong_green: :mahjong_west:\nnostr:npub1whanysx54uf9tgjfeueljg3498kyru3rhwxajwuzh0nw0x0eujss9tlcjh GET sutehai?",
    created_at: 1723429982,
    id: "b771914565200f560e1aaba6b39ee7727fb94dd545d4665369612807547e0a98",
    kind: 42,
    pubkey: "93e68a5f7bf6d35f0cb1288160e42ecdb3396b80bb686a528199dfc5e58ceb25",
    sig: "5300f00f45472ace7e999c97049d36f160f42451f6d8c90aa4deff00e3baff5ed827d142060bb28c6a91f02561c28a8295a07bb57522b5f2fd4b06667d1ee1d1",
    tags: [
      [
        "e",
        "c8d5c2709a5670d6f621ac8020ac3e4fc3057a4961a15319f7c0818309407723",
        "",
        "root",
      ],
      [
        "e",
        "044ec07df2658fade16a87cd61ddbacd2a43c9c2d1486b963c1a7cdc9858dbc0",
        "",
        "mention",
      ],
      [
        "p",
        "75fb3240d4af1255a249cf33f9223529ec41f223bb8dd93b82bbe6e799f9e4a1",
        "",
      ],
      ["emoji", "mahjong_m2", "https://awayuki.github.io/emoji/mahjong-m2.png"],
      ["emoji", "mahjong_m3", "https://awayuki.github.io/emoji/mahjong-m3.png"],
      ["emoji", "mahjong_m4", "https://awayuki.github.io/emoji/mahjong-m4.png"],
      ["emoji", "mahjong_m5", "https://awayuki.github.io/emoji/mahjong-m5.png"],
      ["emoji", "mahjong_s1", "https://awayuki.github.io/emoji/mahjong-s1.png"],
      ["emoji", "mahjong_s2", "https://awayuki.github.io/emoji/mahjong-s2.png"],
      ["emoji", "mahjong_s5", "https://awayuki.github.io/emoji/mahjong-s5.png"],
      ["emoji", "mahjong_s6", "https://awayuki.github.io/emoji/mahjong-s6.png"],
      ["emoji", "mahjong_s8", "https://awayuki.github.io/emoji/mahjong-s8.png"],
      [
        "emoji",
        "mahjong_west",
        "https://awayuki.github.io/emoji/mahjong-west.png",
      ],
      [
        "emoji",
        "mahjong_white",
        "https://awayuki.github.io/emoji/mahjong-white.png",
      ],
      [
        "emoji",
        "mahjong_green",
        "https://awayuki.github.io/emoji/mahjong-green.png",
      ],
      ["nonce", "1"],
    ],
  },
];

test("sort", () => {
  const res = sortEvents(data);
  expect(res.map((re) => re.id)).toStrictEqual([
    "2fb7c5b48e3f0c49e5d6789209d073061b1f79c12babf5a194f3e9106740e50c",
    "91b13993dc482a96cfe409384fe24b9f0862f5883f50dcc6907bb0428348b7d0",
    "b771914565200f560e1aaba6b39ee7727fb94dd545d4665369612807547e0a98",
  ]);
});
