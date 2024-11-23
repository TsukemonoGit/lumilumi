import type MarkdownIt from "markdown-it";

const markdownBrPlugin = function (md: MarkdownIt) {
  // <br>, <br/> または <br /> を検出するルールを追加
  md.inline.ruler.before("newline", "break_token", function (state, silent) {
    //inline コンテキストのルールを追加するメソッドです。ここでは "newline" という既存のルールの前に "break_token" という新しいルールを追加しています。

    const pos = state.pos; //現在の解析位置を pos 変数に保存します。これにより、後で文字列のどの部分を解析しているかを把握できます。

    // <br>, <br/> または <br /> にマッチする正規表現
    const breakRegex = /^<br\s*\/?>/i;

    // 現在の位置からマッチを確認
    const match = breakRegex.exec(state.src.slice(pos)); //現在位置から始まる文字列をスライスして、正規表現にマッチするか確認します。state.src.slice(pos) は、state.src から現在の位置以降の部分文字列を取得し、breakRegex 正規表現を使って、その部分文字列に対してマッチを確認しています。

    if (match) {
      if (!silent) {
        //silent はトークンを追加する際のフラグです。silent が true の場合、トークンを追加せずにマッチを確認するだけです。
        // 'hardbreak' トークンを追加
        state.push("hardbreak", "br", 0);
        // console.log(
        //   "[pos]",
        //   pos,
        //   "[state.src]",
        //   state.src,
        //   "[state.src.slice(pos)]",
        //   state.src.slice(pos)
        // );
      }
      // マッチした長さだけ位置を進める
      state.pos += match[0].length;
      return true;
    }

    return false;
  });
};

export default markdownBrPlugin;
