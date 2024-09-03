// sum.test.js
import { expect, test } from "vitest";
import { parseText, parseUnorderedList } from "./content";

test("parseUnorderedList", () => {
  const text =
    "- test\n  - tes\n  - t\n- test\n  - test\n  - test\n    - test\n    - test\n  - test\n- test";
  console.log("parseUnorderedList", parseUnorderedList(text));
});

const testcontent =
  "lnbc200u1png5z54pp5chs5g354nd83t99ltnhdul8acaywsal9rdczeeu6tl43nega3jtsdz29pjxjumrda6kuar9vs5jqmn0wd68ytnzw45kcepqxycyw62zypskgepqdahzqum5daexzem9yqcqzzsxqrrsssp5u0jl5c3xwar6kzv9k73fpaeckxpn84lu3t3vkfjer39n9n8cgprs9qxpqysgq4vf56c827rhleyyn6eyadunmlyq25kscvrxamvax7xajg7n75td88zjl0dl0r2q8505eavyh8y3ycc3slfwehzncwe9av6g8qytm8xgphg4y60";
const event = {
  content:
    "#バズワードランキング\n\n1位: #選挙 (15)\n2位: #早い (12)\n3位: #投票 (12)\n4位: #人 (10)\n5位: #ない (10)\n6位: #ダサい (9)\n7位: #紙幣 (8)\n8位: #権利 (8)\n9位: #新札 (8)\n10位: #理由 (7)\n11位: #times (7)\n12位: #いい (6)\n13位: #参加 (6)\n14位: #タダ (5)\n15位: #感じ (5)\n16位: #札 (4)\n17位: #話 (4)\n18位: #? (4)\n19位: #申し訳なく (4)\n20位: #ポートフォリオ (3)\n21位: #おじさん (3)\n22位: #サイト (3)\n23位: #自分 (3)\n24位: #Nostr (3)\n25位: #通知 (3)\n26位: #反省会 (3)\n27位: #Damus (3)\n28位: #義務 (3)\n29位: #素晴らしい (3)\n30位: #会社 (3)\n31位: #日本 (3)\n32位: #40代 (3)\n33位: #転職 (3)\n34位: #都知事選 (3)\n35位: #日本人 (3)\n36位: #うなぎ (3)\n37位: #暴力 (3)\n38位: #印刷 (3)\n39位: #てすと (2)\n40位: #報 (2)\n41位: #Linux (2)\n42位: #見た目 (2)\n43位: #ダサい話 (2)\n44位: #リレー (2)\n45位: #ひと (2)\n46位: #IVS (2)\n47位: #three.js (2)\n48位: #admin (2)\n49位: #法隆寺 (2)\n50位: #テレビ (2)\n51位: #cd (2)\n52位: #倉木麻衣 (2)\n53位: #多幸感 (2)\n54位: #Alby (2)\n55位: #隣 (2)\n56位: #最上川 (2)\n57位: #栄一 (2)\n58位: #最大音量 (2)\n59位: #明るい (2)\n60位: #声 (2)\n61位: #自民党 (2)\n62位: #有害性 (2)\n63位: #紙 (2)\n64位: #なかっ (2)\n65位: #罪 (2)\n66位: #同級生 (2)\n67位: #300回 (2)\n68位: #ブラウザ (2)\n69位: #気持ちよく (2)\n70位: #検討 (2)\n71位: #ロシア語 (2)\n72位: #自死 (2)\n73位: #おもしろい (2)\n74位: #冷房 (2)\n75位: #価値 (2)\n76位: #エロ動画 (2)\n77位: #店 (2)\n78位: #お札 (2)\n79位: #た紙 (2)\n80位: #Watch (2)\n81位: #古事記 (2)\n82位: #とこ (2)\n83位: #家 (2)\n84位: #有給 (2)\n85位: #申し訳ない気持ち (2)\n86位: #PC (2)\n87位: #検索 (2)\n88位: #slack (2)\n89位: #ポップコーン (2)\n90位: #おいしく (2)\n91位: #顔 (2)\n92位: #努力 (2)\n93位: #2位 (2)\n94位: #茶番 (1)\n95位: #筋肉部分画像 (1)\n96位: #ユーザ (1)\n97位: #びゃっぴー (1)\n98位: #早いスノーデンおはよう (1)\n99位: #思考 (1)\n100位: #諭吉 (1)\n101位: #いいとこ資本主義民主主義 (1)\n102位: #NostrWalletConnect (1)\n103位: #ノスタコちゃん (1)\n104位: #ビットコイン (1)\n105位: #早いクライアント (1)\n106位: #多いHere'smyreferralcodefor:Tami109.SignupandearnBitcoinwalkingshoppingplayinggames (1)\n107位: #ハッピーハッピーハッピー (1)\n108位: #すごい自己暗示 (1)\n109位: #行動 (1)\n110位: #:sushiyuki_beltbeer::puddingkappacoffeeheart1 (1)\n111位: #bluesky (1)\n112位: #バチバチ (1)\n113位: #まあや (1)\n114位: #notifications (1)\n115位: #9割 (1)\n116位: #使用 (1)\n117位: #瓦解 (1)\n118位: #フォロー (1)\n119位: #ぉちぱなら向こう (1)\n120位: #全く面識 (1)\n121位: #PWA (1)\n122位: #鏡 (1)\n123位: #なさそう (1)\n124位: #早いofsatoshi (1)\n125位: #50万円 (1)\n126位: #なかっ勢い (1)\n127位: #就活情報集め屋さん (1)\n128位: #早いアプリiOS (1)\n129位: #少ない土日 (1)\n130位: #少ない範囲お手伝い (1)\n131位: #git (1)\n132位: #自分データ (1)\n133位: #aespa (1)\n134位: #デフォルト (1)\n135位: #会社times (1)\n136位: #ない身内ネタ満載 (1)\n137位: #ないあと (1)\n138位: #早い段階 (1)\n139位: #早首都圏 (1)\n140位: #気持ちよくお家 (1)\n141位: #いい子ちゃん (1)\n142位: #先生方 (1)\n143位: #件 (1)\n144位: #都合 (1)\n145位: #勉強 (1)\n146位: #賛成投票 (1)\n147位: #R-18 (1)\n148位: #返事 (1)\n149位: #よろしくお願いします (1)\n150位: #クマ (1)\n151位: #いんじゃ (1)\n152位: #ひと達 (1)\n153位: #Verifying (1)\n154位: #ダサい選手名フォント (1)\n155位: #ライトニングアドレス (1)\n156位: #standalone (1)\n157位: #apex (1)\n158位: #犯罪 (1)\n159位: #スピ (1)\n160位: #安く♡ (1)\n161位: #副業 (1)\n162位: #日付け (1)\n163位: #ノード (1)\n164位: #適応障害 (1)\n165位: #逆 (1)\n166位: #ロフトベッド (1)\n167位: #頭皮 (1)\n168位: #中田考東浩紀著作 (1)\n169位: #死 (1)\n170位: #卒業 (1)\n171位: #弊アイコンほんとう (1)\n172位: #意味 (1)\n173位: #⇔選挙 (1)\n174位: #いいvim-jp (1)\n175位: #スキーム (1)\n176位: #ガチ (1)\n177位: #なるか感じ (1)\n178位: #おもしろい歴史 (1)\n179位: #駐車場 (1)\n180位: #C89 (1)\n181位: #‍♀ (1)\n182位: #同年代≠同級生 (1)\n183位: #鉄道ひとり旅 (1)\n184位: #教 (1)\n185位: #早い21日 (1)\n186位: #ない期待 (1)\n187位: #ない​:blobfox_hands:​ (1)\n188位: #たのしみ (1)\n189位: #すごいバージョン (1)\n190位: #MV公開 (1)\n191位: #くにおくん (1)\n192位: #最短 (1)\n193位: #しょー (1)\n194位: #キズナアイ (1)\n195位: #password (1)\n196位: #70％ (1)\n197位: #1000円ランチ (1)\n198位: #すごいそう (1)\n199位: #🐰努力 (1)\n200位: #っぽい音楽 (1)\n201位: #アプリ感覚 (1)\n202位: #弊害 (1)\n203位: #NWC (1)\n204位: #ダサくデザイン (1)\n205位: #ぽーまん分身 (1)\n206位: #多いpura vida🤙 (1)\n207位: #デカ (1)\n208位: #ポカリスエットCMソング (1)\n209位: #顔写真じゃなくて (1)\n210位: #日本デビューシングル表題曲 (1)\n211位: #アプリ (1)\n212位: #SKE48斉藤真木子 (1)\n213位: #自己暗示実験高校生 (1)\n214位: #早い返信 (1)\n215位: #にくい (1)\n216位: #変化 (1)\n217位: #自己啓発 (1)\n218位: #スポーツ選手 (1)\n219位: #うさ (1)\n220位: #いいうなぎがおいしいのはわかりきっています (1)\n221位: #ショック (1)\n222位: #金塊 (1)\n223位: #紙幣切り替えきっかけ (1)\n224位: #やすみ (1)\n225位: #Wu (1)\n226位: #😫 (1)\n227位: #中国人 (1)\n228位: #王様 (1)\n229位: #シェア (1)\n230位: #良さそう (1)\n231位: #1人王 (1)\n232位: #環境 (1)\n233位: #もしかして:選挙権 (1)\n234位: #早い程度 (1)\n235位: #早い十分 (1)\n236位: #機能 (1)\n237位: #Upptime (1)\n238位: #しゃれおつ (1)\n239位: #Snort (1)\n240位: #早い友達 (1)\n241位: #皇帝 (1)\n242位: #なるか50% (1)\n243位: #デザイン (1)\n244位: #三島 (1)\n245位: #ハートRabbit緑Nostter (1)\n246位: #期間中シーシャ (1)\n247位: #ーセクハラパワハラカスハラ (1)\n248位: #おせっかい指摘おじさん (1)\n249位: #新札ゲット (1)\n250位: #obsidianはくび (1)\n251位: #車両 (1)\n252位: #塾 (1)\n253位: #額面 (1)\n254位: #多いCheckthisoutTheworld'ssimplestLightningWallet! (1)\n255位: #ゲシュタルト崩壊 (1)\n256位: #ない思想 (1)\n257位: #久しぶり (1)\n258位: #ないポートフォリオ (1)\n259位: #早い日本語日本 (1)\n260位: #なかっ三菱 (1)\n261位: #存在 (1)\n262位: #キャプテン退任 (1)\n263位: #会 (1)\n264位: #ほげ (1)\n265位: #ゴルゴﾌﾟﾛｸﾞﾗﾑｦ停止ｼﾏｼﾀ (1)\n266位: #位置 (1)\n267位: #信任型 (1)\n268位: #加工 (1)\n269位: #対応ウォレット (1)\n270位: #アーリャさんノベル分冊版 (1)\n271位: #面白い使い方 (1)\n272位: #命 (1)\n273位: #視界 (1)\n274位: #形跡 (1)\n275位: #ダサい察し (1)\n276位: #素晴らしい感じ (1)\n277位: #把握 (1)\n278位: #オブジェ (1)\n279位: #古紙再生 (1)\n280位: #参考 (1)\n281位: #あらいさき (1)\n282位: #北朝鮮 (1)\n283位: #偏差値 (1)\n284位: #今すぐ (1)\n285位: #新作AVデリヘル (1)\n286位: #ウェブブラウザ (1)\n287位: #新円切替 (1)\n288位: #マックス (1)\n289位: #本読むか (1)\n290位: #日付 (1)\n291位: #最近の若者 (1)\n292位: #ない趣味 (1)\n293位: #実家 (1)\n294位: #無効票 (1)\n295位: #MyPublicKey:\"ロクヨウ (1)\n296位: #生命 (1)\n297位: #ない断言 (1)\n298位: #机 (1)\n299位: #楽し⚡ (1)\n300位: #私達 (1)\n301位: #詳しくブログ (1)\n302位: #Kuma (1)\n303位: #税金 (1)\n304位: #肖像 (1)\n305位: #ロシア (1)\n306位: #インストール (1)\n307位: #一人 (1)\n308位: #早い初期ウェルカムページ日本語翻訳 (1)\n309位: #THE MUSIC DAY (1)\n310位: #早い検索稼働 (1)\n311位: #日本経済 (1)\n312位: #いいね (1)\n313位: #気持ち (1)\n314位: #申し訳なく裁判所いらん (1)\n315位: #少ない (1)\n316位: #⚡ (1)\n317位: #ダサく紙幣 (1)\n318位: #ウォッチ (1)\n319位: #complex (1)\n320位: #宜しくお願い (1)\n321位: #歳 (1)\n322位: #多い散歩 (1)\n323位: #wifiパスワード (1)\n324位: #髪の毛 (1)\n325位: #ダサい時点 (1)\n326位: #早いandroid (1)\n327位: #大食い武器 (1)\n328位: #次 (1)\n329位: #運用 (1)\n330位: #詳ビ (1)\n331位: #みみそうじ (1)\n332位: #紙天ぷら (1)\n333位: #っぽいそー (1)\n334位: #専制 (1)\n335位: #日本人独裁 (1)\n336位: #資本主義 (1)\n337位: #ツイート (1)\n338位: #陰謀論 (1)\n339位: #柚木姉妹 (1)\n340位: #はあと (1)\n341位: #第23話 (1)\n342位: #めも (1)\n343位: #お互い (1)\n344位: #早い2か月 (1)\n345位: #こんち (1)\n346位: #設定 (1)\n347位: #コロナ気 (1)\n348位: #ないサークル入場 (1)\n349位: #クラスメイト (1)\n350位: #違和感 (1)\n351位: #ないblobfoxdeadRE: (1)\n352位: #ダサいレベル (1)\n353位: #l (1)\n354位: #早いライトニングウォレットチップ⚡ (1)\n355位: #当選 (1)\n356位: #NIP-47 (1)\n357位: #ない主 (1)\n358位: #すごく呼び捨て (1)\n359位: #ぱいしたしっぱいしたしっぱいした (1)\n360位: #デスクトップ (1)\n361位: #るぅ (1)\n362位: #憲法 (1)\n363位: #ないスペ (1)\n364位: #ぺくす@1 (1)\n365位: #民主主義基本 (1)\n366位: #出馬 (1)\n367位: #独裁 (1)\n368位: #体 (1)\n369位: #小学校 (1)\n370位: #散財 (1)\n371位: #近い (1)\n372位: #追加 (1)\n373位: #弊社 (1)\n374位: #お勧め (1)\n375位: #ものすごく世代 (1)\n376位: #罰則付き (1)\n377位: #あと遺産 (1)\n378位: #ボルシチ (1)\n379位: #少ないフォロー (1)\n380位: #双葉 (1)\n381位: #議員 (1)\n382位: #🤙🏼 (1)\n383位: #エラバレシ (1)\n384位: #ない印刷 (1)\n385位: #ハローDamus (1)\n386位: #自己主張1000% (1)\n387位: #年金 (1)\n388位: #多い (1)\n389位: #上位勢 (1)\n390位: #かー (1)\n391位: #議員方々 (1)\n392位: #美味かっガチ (1)\n393位: #なんとか (1)\n394位: #ザップコメント修正 (1)\n395位: #ビュルンビュルン謎 (1)\n396位: #早い12月 (1)\n397位: #選挙厨 (1)\n398位: #最後 (1)\n399位: #AKB (1)\n400位: #白紙委任 (1)\n401位: #のれんしゅう (1)\n402位: #times, (1)\n403位: #作品 (1)\n404位: #> (1)\n405位: #目 (1)\n406位: #ない品書き (1)\n407位: #ない一般入場開始 (1)\n408位: #イベント (1)\n409位: #発表 (1)\n410位: #病 (1)\n411位: #リアクション (1)\n412位: #明るい世界 (1)\n413位: #ケツ (1)\n414位: #ない興味 (1)\n415位: #万物 (1)\n416位: #規制 (1)\n417位: #仕組み (1)\n418位: #少ない世界トップ１０公開影響 (1)\n419位: #画像うp (1)\n420位: #状態発表ドラゴン (1)\n421位: #にくいマジレス (1)\n422位: #素晴らしいアイデア (1)\n423位: #小学5年生 (1)\n424位: #別れ (1)\n425位: #芋づる式 (1)\n426位: #早いsMiles (1)\n427位: #しか (1)\n428位: #肖像画 (1)\n429位: #おいしく参考 (1)\n430位: #上 (1)\n431位: #r (1)\n432位: #1982年生 (1)\n433位: #親 (1)\n434位: #報告 (1)\n435位: #両立 (1)\n436位: #はじ (1)\n437位: #ムキムキ (1)\n438位: #ガチ引きこもり (1)\n439位: #いい別次元 (1)\n440位: #権利と義務 (1)\n441位: #最新トレンド (1)\n442位: #周囲 (1)\n443位: #ユーザー (1)\n444位: #すごい (1)\n445位: #友達 (1)\n446位: #¬うなぎ (1)\n447位: #動作瞑想 (1)\n448位: #スマホ (1)\n449位: #ダサい統一 (1)\n450位: #kaijiさん (1)\n451位: #watchparty (1)\n452位: #詳しそう (1)\n453位: #気 (1)\n454位: #申し訳なさ (1)\n455位: #知り合いバイアス (1)\n456位: #ぶっちゃけNostr (1)\n457位: #理想 (1)\n458位: #都度 (1)\n459位: #こーだ (1)\n460位: #100 (1)\n461位: #234レベル56 (1)\n462位: #小学生 (1)\n463位: #一社 (1)\n464位: #筋トレ (1)\n465位: #ダサいユニバーサルデザイン (1)\n466位: #マインドフルネス (1)\n467位: #集まり (1)\n468位: #スクランブル (1)\n469位: #ない価値 (1)\n470位: #ぽーまんさん (1)\n471位: #なんとか体 (1)\n472位: #いらっしゃい (1)\n473位: #日本円 (1)\n474位: #こんにちは。 (1)\n475位: #チヨダ報告 (1)\n476位: #Ayumu (1)\n477位: #世界 (1)\n478位: #整理 (1)\n479位: #た分報 (1)\n480位: #Uptime (1)\n481位: #用法容量注意 (1)\n482位: #ウェブアプリ (1)\n483位: #一回 (1)\n484位: #😭 (1)\n485位: #早いユーザー (1)\n486位: #...w (1)\n487位: #芦屋市長 (1)\n488位: #関係 (1)\n489位: #アカウント名 (1)\n490位: #copilot (1)\n491位: #燦々SUNKADOKAWA (1)\n492位: #ない他 (1)\n493位: #早いベストnostrgram.coInstagramオマージュ (1)\n494位: #なかっ席巻 (1)\n495位: #解説 (1)\n496位: #早いsat (1)\n497位: #病が (1)\n498位: #メリデメ (1)\n499位: #渋沢 (1)\n500位: #早起き (1)\n501位: #早いiPhone (1)\n502位: #ぅぉっちぱしたい (1)\n503位: #ダサいJリーグユニ背番号 (1)\n504位: #3年 (1)\n505位: #ユニバーサルデザイン (1)\n506位: #美味かっ自分天丼 (1)\n507位: #区長選挙 (1)\n508位: #ダサく (1)\n509位: #皆様こんゆず! (1)\n510位: #総選挙 (1)\n511位: #Xiaomiさん (1)\n512位: #購入 (1)\n513位: #おいしく登場 (1)\n514位: #政治 (1)\n515位: #超絶 (1)\n516位: #早い有料スパム (1)\n517位: #音楽 (1)\n518位: #ない中身 (1)\n519位: #なかっ次エアコン (1)\n520位: #早いライトニングストア2023記念Tシャツ (1)\n521位: #早いおすすめライトニングアドレス対応取引所ビットコイン (1)\n522位: #ケモセーフ (1)\n523位: #クリア (1)\n524位: #数年間 (1)\n525位: #Discord (1)\n526位: #申し訳なくいいね (1)\n527位: #テスト (1)\n528位: #1万円札 (1)\n529位: #願望 (1)\n530位: #提出 (1)\n531位: #もえのあずき (1)\n532位: #柚木ちの四兄弟 (1)\n533位: #ﾌﾝﾎｰ (1)\n534位: #雨穴 (1)\n535位: #ギットコパイロット (1)\n536位: #notion (1)\n537位: #同年代一般人 (1)\n538位: #素晴らしい期待 (1)\n539位: #成果出て (1)\n540位: #! (1)\n541位: #ない同級生想定 (1)\n542位: #NodeConnect (1)\n543位: #ロビー (1)\n544位: #feed (1)\n545位: #チェック (1)\n546位: #ないなんとか (1)\n547位: #レベル1 (1)\n548位: #エルデンクリア (1)\n549位: #ーーー (1)\n550位: #ネット意識調査 (1)\n551位: #偉さ (1)\n552位: #kaiji (1)\n553位: #全裸中年男性 (1)\n554位: #なく胸手 (1)\n555位: #sats受け取りメール通知機能 (1)\n556位: #hello! (1)\n557位: #lnbc100n1p36sgpdpp5mh5v3hnnuy9t4x4uarwhyajuahdt0jhnhraulut4jz4y8jpmspvsdqqcqzpgxqyzqsu6fntc5cy077l92r8ccekxskxhfyqznnsp52uud6valssqyyssqeyvzp6tfprjt2yzsuc92wcrpanluaazyzdxe5cdlyqqgyx4459w2vnnc674rqjs4gsugmlar4gt3ll92ltlqusp0wwx (1)\n558位: #@父親 (1)\n559位: #dankogai (1)\n560位: #先 (1)\n561位: #サークル名由来話 (1)\n562位: #イベント告知 (1)\n563位: #届け♪ (1)\n564位: #美味かっ (1)\n565位: #素晴らしいSPARKING (1)\n566位: #ユズナー (1)\n567位: #脱出済み (1)\n568位: #もうだめぽ (1)\n569位: #水ダウ (1)\n570位: #ないサイコー本 (1)\n571位: #にくい紙幣肖像 (1)\n572位: #興味 (1)\n573位: #ミュート (1)\n574位: #よぃーー (1)\n575位: #の子 (1)\n576位: #Party (1)\n577位: #っぽい (1)\n578位: #無料 (1)\n579位: #練馬区民 (1)\n580位: #147 (1)\n581位: #ライトニングウォレット (1)\n582位: #投票権 (1)\n583位: #ぱ (1)\n584位: #nostter,Amethist (1)\n585位: #申し訳なく人 (1)\n586位: #すゝめ (1)\n587位: #もろ (1)\n588位: #修正資本主義 (1)\n589位: #法定休日 (1)\n590位: #少ない見かけ (1)\n591位: #クリプト払い (1)\n592位: #隕石 (1)\n593位: #ない投票 (1)\n594位: #早いライブ配信参加 (1)\n595位: #著作権 (1)\n596位: #Lightning (1)\n597位: #早いログインリレー (1)\n598位: #なかっ矢継ぎ早発表 (1)\n599位: #10年前 (1)\n600位: #ぅぉちぱしよや (1)\n601位: #早いedenlandmilou.lol最後nostricaイベント3月19日 (1)\n602位: #意識調査 (1)\n603位: #素晴らしい個性表現 (1)\n604位: #申し訳なく警察 (1)\n605位: #肌ツルスベ (1)\n606位: #楽し緊張 (1)\n607位: #瞑想 (1)\n608位: #50 (1)\n609位: #ない人生 (1)\n610位: #破壊 (1)\n611位: #jack (1)\n612位: #宇多田 (1)\n613位: #微博上的兰大那是通缩死忠粉 (1)\n614位: #特番 (1)\n615位: #明るい周知の事実 (1)\n616位: #政策 (1)\n617位: #トイレ (1)\n618位: #見出し (1)\n619位: #コスパ悪 (1)\n620位: #グリコ (1)\n621位: #変態 (1)\n622位: #大学 (1)\n623位: #上坂すみれ (1)\n624位: #偽造防止 (1)\n625位: #kogaiさん (1)\n626位: #ダサく他国 (1)\n627位: #プーチンさん (1)\n628位: #ふつう (1)\n629位: #+ (1)\n630位: #なかっ市場 (1)\n631位: #天ぷら (1)\n632位: #ｸﾞｴ... (1)\n633位: #Darms (1)\n634位: #いいんじゃない (1)\n635位: #とっとこハム太郎 (1)\n636位: #高校話 (1)\n637位: #いいしそつ (1)\n638位: #イメージ (1)\n639位: #裏 (1)\n640位: #いい一回きりの人生 (1)\n641位: #確認 (1)\n642位: #ﾀｺ部分 (1)\n643位: #苦情 (1)\n644位: #GLAYRockon (1)\n645位: #ノート (1)\n646位: #ギットコハム太郎 (1)\n647位: #名前 (1)\n648位: #野球 (1)\n649位: #立候補 (1)\n650位: #出走 (1)\n651位: #ないコスプレしながら土下座謝罪 (1)\n652位: #怖い (1)\n653位: #苗字 (1)\n654位: #とうふさん (1)\n655位: #分からん (1)\n656位: #apex4人目募集中 (1)\n657位: #フロントエンド (1)\n658位: #[監視ｼｽﾃﾑ]ﾖﾘ発報 (1)\n659位: #YouTube (1)\n660位: #いい知識受け売り (1)\n661位: #耳 (1)\n662位: #マジで訴訟 (1)\n663位: #バ美肉紙幣 (1)\n664位: #20 (1)\n665位: #かやり (1)\n666位: #宜しくバグ (1)\n667位: #少ない感じ (1)\n668位: #式民精神 (1)\n669位: #事 (1)\n670位: #投稿 (1)\n671位: #リクエスト (1)\n672位: #文句 (1)\n673位: #早いあとnip-5アカウント認証 (1)\n674位: #怎么 (1)\n675位: #音量 (1)\n676位: #修正 (1)\n677位: #早いにもcoracle.social,snortiris.toastralninjaetc... (1)\n678位: #布団 (1)\n679位: #ない? (1)\n680位: #自体 (1)\n681位: #デレ (1)\n682位: #ダサくユーロ (1)\n683位: #世の中 (1)\n684位: #いいCVE解説 (1)\n685位: #納税義務 (1)\n686位: #素晴らしいオブジェ (1)\n687位: #楽しノスターちゃん (1)\n688位: #スマホアプリ (1)\n689位: #早いwallet (1)\n690位: #なまきょ (1)\n691位: #Imazu (1)\n692位: #招待制 (1)\n693位: #disable (1)\n694位: #早いdamus (1)\n695位: #選挙権行使 (1)\n696位: #神 (1)\n697位: #みんなの運動量 (1)\n698位: #fail! (1)\n699位: #統計 (1)\n700位: #謎 (1)\n701位: #過程 (1)\n702位: #複数 (1)\n703位: #クライアント (1)\n704位: #ものすごく (1)\n705位: #公開鍵 (1)\n706位: #定期的 (1)\n707位: #BotFightMode (1)\n708位: #早いコスタリカ (1)\n709位: #理由人 (1)\n710位: #主義 (1)\n711位: #ダサいキモい (1)\n712位: #ぇわ (1)\n713位: #状況 (1)\n714位: #monoさん (1)\n715位: #ねる (1)\n716位: #主張 (1)\n717位: #明るい全裸中年男性 (1)\n718位: #teams (1)\n719位: #蓮舫 (1)\n720位: #ない写真 (1)\n721位: #隣人 (1)\n722位: #CF (1)\n723位: #就職 (1)\n724位: #代 (1)\n725位: #あらい (1)\n726位: #ネル (1)\n727位: #肌 (1)\n728位: #新札対応 (1)\n729位: #アニメイラスト (1)\n730位: #志望校 (1)\n731位: #ﾀｺﾔｷ神 (1)\n732位: #プロトコルブリッジ実行 (1)\n733位: #保存 (1)\n734位: #すごいハイパフォーマンス (1)\n735位: #政治団体政策 (1)\n736位: #応援 (1)\n737位: #音量3 (1)\n738位: #感覚麻痺 (1)\n739位: #おさん (1)\n740位: #2020年1月電話 (1)\n741位: #えて (1)\n742位: #多いWoS (1)\n743位: #心配 (1)\n744位: #slack, (1)\n745位: #Passwordpassword (1)\n746位: #個々 (1)\n747位: #分包 (1)\n748位: #美味かっ模様 (1)\n749位: #サーバ (1)\n750位: #SPARKING (1)\n751位: #ID: (1)\n752位: #無かっそりゃそうだ (1)\n753位: #一時間ごと (1)\n754位: #百合子 (1)\n755位: #おいしく紙 (1)\n756位: #楽しそう (1)\n757位: #卒業発表 (1)\n758位: #能登復興支援ライブ生中継 (1)\n759位: #新曲 (1)\n760位: #政治的主張 (1)\n761位: #藤井フミヤ (1)\n762位: #いいうなぎ (1)\n763位: #加藤隆 (1)\n764位: #ゃっ (1)\n765位: #ふさわしそう (1)\n766位: #あと2日 (1)\n767位: #くりぃむナンタラあるじゃん (1)\n768位: #偉 (1)\n769位: #回収 (1)\n770位: #多い雰囲気 (1)\n771位: #投票行動 (1)\n772位: #SNS (1)\n773位: #早い中国 (1)\n774位: #めんどい記名 (1)\n775位: #録画ソフト (1)\n776位: #なかっチューナーレス大型テレビ電気自動車ドラム式洗濯機 (1)\n777位: #人達 (1)\n778位: #候補 (1)\n779位: #倉木麻衣年上 (1)\n780位: #SocialClub登場 (1)\n781位: #ファン (1)\n782位: #コミケ (1)\n\nhttps://image.nostr.build/0756e46bed5e8084c1c8f526a677c2f19e9198b36a8c1aba02eb38416e661a24.jpg",
  created_at: 1720019686,
  id: "6029c5997fc79857f3cdee2d855f84c101c83b1c1afb9623e5e54790c95f7fb0",
  kind: 42,
  pubkey: "f768fae9f2390a5223f000a424deb9302a9381e33abb8b084ca844f691b11cdd",
  sig: "bbdc89a2ae279141fe7894ccee0eb6a8531e404693d3f94a161ca6b0b055a17fd6f4549c38e2abe21e6a4174594386b6b3a5c70ad0ac2591c1463a5b00cee8d6",
  tags: [
    ["t", "選挙"],
    ["t", "早い"],
    ["t", "投票"],
    ["t", "人"],
    ["t", "ない"],
    ["t", "ダサい"],
    ["t", "紙幣"],
    ["t", "権利"],
    ["t", "新札"],
    ["t", "理由"],
    ["t", "times"],
    ["t", "いい"],
    ["t", "参加"],
    ["t", "タダ"],
    ["t", "感じ"],
    ["t", "札"],
    ["t", "話"],
    ["t", "?"],
    ["t", "申し訳なく"],
    ["t", "ポートフォリオ"],
    ["t", "おじさん"],
    ["t", "サイト"],
    ["t", "自分"],
    ["t", "Nostr"],
    ["t", "通知"],
    ["t", "反省会"],
    ["t", "Damus"],
    ["t", "義務"],
    ["t", "素晴らしい"],
    ["t", "会社"],
    ["t", "日本"],
    ["t", "40代"],
    ["t", "転職"],
    ["t", "都知事選"],
    ["t", "日本人"],
    ["t", "うなぎ"],
    ["t", "暴力"],
    ["t", "印刷"],
    ["t", "てすと"],
    ["t", "報"],
    ["t", "Linux"],
    ["t", "見た目"],
    ["t", "ダサい話"],
    ["t", "リレー"],
    ["t", "ひと"],
    ["t", "IVS"],
    ["t", "three.js"],
    ["t", "admin"],
    ["t", "法隆寺"],
    ["t", "テレビ"],
    ["t", "cd"],
    ["t", "倉木麻衣"],
    ["t", "多幸感"],
    ["t", "Alby"],
    ["t", "隣"],
    ["t", "最上川"],
    ["t", "栄一"],
    ["t", "最大音量"],
    ["t", "明るい"],
    ["t", "声"],
    ["t", "自民党"],
    ["t", "有害性"],
    ["t", "なかっ"],
    ["t", "罪"],
    ["t", "同級生"],
    ["t", "300回"],
    ["t", "ブラウザ"],
    ["t", "気持ちよく"],
    ["t", "検討"],
    ["t", "ロシア語"],
    ["t", "自死"],
    ["t", "おもしろい"],
    ["t", "冷房"],
    ["t", "価値"],
    ["t", "エロ動画"],
    ["t", "店"],
    ["t", "お札"],
    ["t", "た紙"],
    ["t", "Watch"],
    ["t", "古事記"],
    ["t", "とこ"],
    ["t", "家"],
    ["t", "有給"],
    ["t", "申し訳ない気持ち"],
    ["t", "PC"],
    ["t", "検索"],
    ["t", "slack"],
    ["t", "ポップコーン"],
    ["t", "おいしく"],
    ["t", "顔"],
    ["t", "努力"],
    ["t", "2位"],
    ["t", "茶番"],
    ["t", "筋肉部分画像"],
    ["t", "ユーザ"],
    ["t", "びゃっぴー"],
    ["t", "早いスノーデンおはよう"],
    ["t", "思考"],
    ["t", "諭吉"],
    ["t", "いいとこ資本主義民主主義"],
    ["t", "NostrWalletConnect"],
    ["t", "ノスタコちゃん"],
    ["t", "ビットコイン"],
    ["t", "早いクライアント"],
    [
      "t",
      "多いHere'smyreferralcodefor:Tami109.SignupandearnBitcoinwalkingshoppingplayinggames",
    ],
    ["t", "ハッピーハッピーハッピー"],
    ["t", "すごい自己暗示"],
    ["t", "行動"],
    ["t", ":sushiyuki_beltbeer::puddingkappacoffeeheart1"],
    ["t", "bluesky"],
    ["t", "バチバチ"],
    ["t", "まあや"],
    ["t", "notifications"],
    ["t", "9割"],
    ["t", "使用"],
    ["t", "瓦解"],
    ["t", "フォロー"],
    ["t", "ぉちぱなら向こう"],
    ["t", "全く面識"],
    ["t", "PWA"],
    ["t", "鏡"],
    ["t", "なさそう"],
    ["t", "早いofsatoshi"],
    ["t", "50万円"],
    ["t", "なかっ勢い"],
    ["t", "就活情報集め屋さん"],
    ["t", "早いアプリiOS"],
    ["t", "少ない土日"],
    ["t", "少ない範囲お手伝い"],
    ["t", "git"],
    ["t", "自分データ"],
    ["t", "aespa"],
    ["t", "デフォルト"],
    ["t", "会社times"],
    ["t", "ない身内ネタ満載"],
    ["t", "ないあと"],
    ["t", "早い段階"],
    ["t", "早首都圏"],
    ["t", "気持ちよくお家"],
    ["t", "いい子ちゃん"],
    ["t", "先生方"],
    ["t", "件"],
    ["t", "都合"],
    ["t", "勉強"],
    ["t", "賛成投票"],
    ["t", "R-18"],
    ["t", "返事"],
    ["t", "よろしくお願いします"],
    ["t", "クマ"],
    ["t", "いんじゃ"],
    ["t", "ひと達"],
    ["t", "Verifying"],
    ["t", "ダサい選手名フォント"],
    ["t", "ライトニングアドレス"],
    ["t", "standalone"],
    ["t", "apex"],
    ["t", "犯罪"],
    ["t", "スピ"],
    ["t", "安く♡"],
    ["t", "副業"],
    ["t", "日付け"],
    ["t", "ノード"],
    ["t", "適応障害"],
    ["t", "逆"],
    ["t", "ロフトベッド"],
    ["t", "頭皮"],
    ["t", "中田考東浩紀著作"],
    ["t", "死"],
    ["t", "卒業"],
    ["t", "弊アイコンほんとう"],
    ["t", "意味"],
    ["t", "⇔選挙"],
    ["t", "いいvim-jp"],
    ["t", "スキーム"],
    ["t", "ガチ"],
    ["t", "なるか感じ"],
    ["t", "おもしろい歴史"],
    ["t", "駐車場"],
    ["t", "C89"],
    ["t", "‍♀"],
    ["t", "同年代≠同級生"],
    ["t", "鉄道ひとり旅"],
    ["t", "教"],
    ["t", "早い21日"],
    ["t", "ない期待"],
    ["t", "ない​:blobfox_hands:​"],
    ["t", "たのしみ"],
    ["t", "すごいバージョン"],
    ["t", "MV公開"],
    ["t", "くにおくん"],
    ["t", "最短"],
    ["t", "しょー"],
    ["t", "キズナアイ"],
    ["t", "password"],
    ["t", "70％"],
    ["t", "1000円ランチ"],
    ["t", "すごいそう"],
    ["t", "🐰努力"],
    ["t", "っぽい音楽"],
    ["t", "アプリ感覚"],
    ["t", "弊害"],
    ["t", "NWC"],
    ["t", "ダサくデザイン"],
    ["t", "ぽーまん分身"],
    ["t", "多いpura vida🤙"],
    ["t", "デカ"],
    ["t", "ポカリスエットCMソング"],
    ["t", "顔写真じゃなくて"],
    ["t", "日本デビューシングル表題曲"],
    ["t", "SKE48斉藤真木子"],
    ["t", "自己暗示実験高校生"],
    ["t", "早い返信"],
    ["t", "にくい"],
    ["t", "変化"],
    ["t", "自己啓発"],
    ["t", "スポーツ選手"],
    ["t", "うさ"],
    ["t", "いいうなぎがおいしいのはわかりきっています"],
    ["t", "ショック"],
    ["t", "金塊"],
    ["t", "紙幣切り替えきっかけ"],
    ["t", "やすみ"],
    ["t", "Wu"],
    ["t", "😫"],
    ["t", "中国人"],
    ["t", "王様"],
    ["t", "シェア"],
    ["t", "良さそう"],
    ["t", "1人王"],
    ["t", "環境"],
    ["t", "もしかして:選挙権"],
    ["t", "早い程度"],
    ["t", "早い十分"],
    ["t", "機能"],
    ["t", "Upptime"],
    ["t", "しゃれおつ"],
    ["t", "Snort"],
    ["t", "早い友達"],
    ["t", "皇帝"],
    ["t", "なるか50%"],
    ["t", "デザイン"],
    ["t", "三島"],
    ["t", "ハートRabbit緑Nostter"],
    ["t", "期間中シーシャ"],
    ["t", "ーセクハラパワハラカスハラ"],
    ["t", "おせっかい指摘おじさん"],
    ["t", "新札ゲット"],
    ["t", "obsidianはくび"],
    ["t", "車両"],
    ["t", "塾"],
    ["t", "額面"],
    ["t", "多いCheckthisoutTheworld'ssimplestLightningWallet!"],
    ["t", "ゲシュタルト崩壊"],
    ["t", "ない思想"],
    ["t", "久しぶり"],
    ["t", "ないポートフォリオ"],
    ["t", "早い日本語日本"],
    ["t", "なかっ三菱"],
    ["t", "存在"],
    ["t", "キャプテン退任"],
    ["t", "ほげ"],
    ["t", "ゴルゴﾌﾟﾛｸﾞﾗﾑｦ停止ｼﾏｼﾀ"],
    ["t", "位置"],
    ["t", "信任型"],
    ["t", "加工"],
    ["t", "対応ウォレット"],
    ["t", "アーリャさんノベル分冊版"],
    ["t", "面白い使い方"],
    ["t", "命"],
    ["t", "視界"],
    ["t", "形跡"],
    ["t", "ダサい察し"],
    ["t", "素晴らしい感じ"],
    ["t", "把握"],
    ["t", "オブジェ"],
    ["t", "古紙再生"],
    ["t", "参考"],
    ["t", "あらいさき"],
    ["t", "北朝鮮"],
    ["t", "偏差値"],
    ["t", "今すぐ"],
    ["t", "新作AVデリヘル"],
    ["t", "ウェブブラウザ"],
    ["t", "新円切替"],
    ["t", "マックス"],
    ["t", "本読むか"],
    ["t", "最近の若者"],
    ["t", "ない趣味"],
    ["t", "実家"],
    ["t", "無効票"],
    ["t", 'MyPublicKey:"ロクヨウ'],
    ["t", "生命"],
    ["t", "ない断言"],
    ["t", "机"],
    ["t", "楽し⚡"],
    ["t", "私達"],
    ["t", "詳しくブログ"],
    ["t", "Kuma"],
    ["t", "税金"],
    ["t", "肖像"],
    ["t", "インストール"],
    ["t", "一人"],
    ["t", "早い初期ウェルカムページ日本語翻訳"],
    ["t", "THE MUSIC DAY"],
    ["t", "早い検索稼働"],
    ["t", "日本経済"],
    ["t", "いいね"],
    ["t", "申し訳なく裁判所いらん"],
    ["t", "⚡"],
    ["t", "ダサく紙幣"],
    ["t", "ウォッチ"],
    ["t", "complex"],
    ["t", "宜しくお願い"],
    ["t", "歳"],
    ["t", "多い散歩"],
    ["t", "wifiパスワード"],
    ["t", "髪の毛"],
    ["t", "ダサい時点"],
    ["t", "早いandroid"],
    ["t", "大食い武器"],
    ["t", "次"],
    ["t", "運用"],
    ["t", "詳ビ"],
    ["t", "みみそうじ"],
    ["t", "紙天ぷら"],
    ["t", "っぽいそー"],
    ["t", "専制"],
    ["t", "日本人独裁"],
    ["t", "資本主義"],
    ["t", "ツイート"],
    ["t", "陰謀論"],
    ["t", "柚木姉妹"],
    ["t", "はあと"],
    ["t", "第23話"],
    ["t", "めも"],
    ["t", "お互い"],
    ["t", "早い2か月"],
    ["t", "こんち"],
    ["t", "設定"],
    ["t", "コロナ気"],
    ["t", "ないサークル入場"],
    ["t", "クラスメイト"],
    ["t", "違和感"],
    ["t", "ないblobfoxdeadRE:"],
    ["t", "ダサいレベル"],
    ["t", "l"],
    ["t", "早いライトニングウォレットチップ⚡"],
    ["t", "当選"],
    ["t", "NIP-47"],
    ["t", "ない主"],
    ["t", "すごく呼び捨て"],
    ["t", "ぱいしたしっぱいしたしっぱいした"],
    ["t", "デスクトップ"],
    ["t", "るぅ"],
    ["t", "憲法"],
    ["t", "ないスペ"],
    ["t", "ぺくす@1"],
    ["t", "民主主義基本"],
    ["t", "出馬"],
    ["t", "独裁"],
    ["t", "体"],
    ["t", "小学校"],
    ["t", "散財"],
    ["t", "近い"],
    ["t", "追加"],
    ["t", "弊社"],
    ["t", "お勧め"],
    ["t", "ものすごく世代"],
    ["t", "罰則付き"],
    ["t", "あと遺産"],
    ["t", "ボルシチ"],
    ["t", "少ないフォロー"],
    ["t", "双葉"],
    ["t", "議員"],
    ["t", "🤙🏼"],
    ["t", "エラバレシ"],
    ["t", "ない印刷"],
    ["t", "ハローDamus"],
    ["t", "自己主張1000%"],
    ["t", "年金"],
    ["t", "上位勢"],
    ["t", "かー"],
    ["t", "議員方々"],
    ["t", "美味かっガチ"],
    ["t", "なんとか"],
    ["t", "ザップコメント修正"],
    ["t", "ビュルンビュルン謎"],
    ["t", "早い12月"],
    ["t", "選挙厨"],
    ["t", "最後"],
    ["t", "AKB"],
    ["t", "白紙委任"],
    ["t", "のれんしゅう"],
    ["t", "times,"],
    ["t", "作品"],
    ["t", ">"],
    ["t", "目"],
    ["t", "ない品書き"],
    ["t", "ない一般入場開始"],
    ["t", "イベント"],
    ["t", "発表"],
    ["t", "病"],
    ["t", "リアクション"],
    ["t", "明るい世界"],
    ["t", "ケツ"],
    ["t", "ない興味"],
    ["t", "万物"],
    ["t", "規制"],
    ["t", "仕組み"],
    ["t", "少ない世界トップ１０公開影響"],
    ["t", "画像うp"],
    ["t", "状態発表ドラゴン"],
    ["t", "にくいマジレス"],
    ["t", "素晴らしいアイデア"],
    ["t", "小学5年生"],
    ["t", "別れ"],
    ["t", "芋づる式"],
    ["t", "早いsMiles"],
    ["t", "しか"],
    ["t", "肖像画"],
    ["t", "おいしく参考"],
    ["t", "r"],
    ["t", "1982年生"],
    ["t", "親"],
    ["t", "報告"],
    ["t", "両立"],
    ["t", "はじ"],
    ["t", "ムキムキ"],
    ["t", "ガチ引きこもり"],
    ["t", "いい別次元"],
    ["t", "権利と義務"],
    ["t", "最新トレンド"],
    ["t", "周囲"],
    ["t", "ユーザー"],
    ["t", "友達"],
    ["t", "¬うなぎ"],
    ["t", "動作瞑想"],
    ["t", "スマホ"],
    ["t", "ダサい統一"],
    ["t", "kaijiさん"],
    ["t", "watchparty"],
    ["t", "詳しそう"],
    ["t", "申し訳なさ"],
    ["t", "知り合いバイアス"],
    ["t", "ぶっちゃけNostr"],
    ["t", "理想"],
    ["t", "都度"],
    ["t", "こーだ"],
    ["t", "234レベル56"],
    ["t", "小学生"],
    ["t", "一社"],
    ["t", "筋トレ"],
    ["t", "ダサいユニバーサルデザイン"],
    ["t", "マインドフルネス"],
    ["t", "集まり"],
    ["t", "スクランブル"],
    ["t", "ない価値"],
    ["t", "ぽーまんさん"],
    ["t", "なんとか体"],
    ["t", "いらっしゃい"],
    ["t", "日本円"],
    ["t", "こんにちは。"],
    ["t", "チヨダ報告"],
    ["t", "Ayumu"],
    ["t", "世界"],
    ["t", "整理"],
    ["t", "た分報"],
    ["t", "Uptime"],
    ["t", "用法容量注意"],
    ["t", "ウェブアプリ"],
    ["t", "一回"],
    ["t", "😭"],
    ["t", "早いユーザー"],
    ["t", "...w"],
    ["t", "芦屋市長"],
    ["t", "関係"],
    ["t", "アカウント名"],
    ["t", "copilot"],
    ["t", "燦々SUNKADOKAWA"],
    ["t", "ない他"],
    ["t", "早いベストnostrgram.coInstagramオマージュ"],
    ["t", "なかっ席巻"],
    ["t", "解説"],
    ["t", "早いsat"],
    ["t", "病が"],
    ["t", "メリデメ"],
    ["t", "渋沢"],
    ["t", "早起き"],
    ["t", "早いiPhone"],
    ["t", "ぅぉっちぱしたい"],
    ["t", "ダサいJリーグユニ背番号"],
    ["t", "3年"],
    ["t", "ユニバーサルデザイン"],
    ["t", "美味かっ自分天丼"],
    ["t", "区長選挙"],
    ["t", "皆様こんゆず!"],
    ["t", "総選挙"],
    ["t", "Xiaomiさん"],
    ["t", "購入"],
    ["t", "おいしく登場"],
    ["t", "政治"],
    ["t", "超絶"],
    ["t", "早い有料スパム"],
    ["t", "音楽"],
    ["t", "ない中身"],
    ["t", "なかっ次エアコン"],
    ["t", "早いライトニングストア2023記念Tシャツ"],
    ["t", "早いおすすめライトニングアドレス対応取引所ビットコイン"],
    ["t", "ケモセーフ"],
    ["t", "クリア"],
    ["t", "数年間"],
    ["t", "Discord"],
    ["t", "申し訳なくいいね"],
    ["t", "テスト"],
    ["t", "1万円札"],
    ["t", "願望"],
    ["t", "提出"],
    ["t", "もえのあずき"],
    ["t", "柚木ちの四兄弟"],
    ["t", "ﾌﾝﾎｰ"],
    ["t", "雨穴"],
    ["t", "ギットコパイロット"],
    ["t", "notion"],
    ["t", "同年代一般人"],
    ["t", "素晴らしい期待"],
    ["t", "成果出て"],
    ["t", "!"],
    ["t", "ない同級生想定"],
    ["t", "NodeConnect"],
    ["t", "ロビー"],
    ["t", "feed"],
    ["t", "チェック"],
    ["t", "ないなんとか"],
    ["t", "レベル1"],
    ["t", "エルデンクリア"],
    ["t", "ーーー"],
    ["t", "ネット意識調査"],
    ["t", "偉さ"],
    ["t", "全裸中年男性"],
    ["t", "なく胸手"],
    ["t", "sats受け取りメール通知機能"],
    ["t", "hello!"],
    [
      "t",
      "lnbc100n1p36sgpdpp5mh5v3hnnuy9t4x4uarwhyajuahdt0jhnhraulut4jz4y8jpmspvsdqqcqzpgxqyzqsu6fntc5cy077l92r8ccekxskxhfyqznnsp52uud6valssqyyssqeyvzp6tfprjt2yzsuc92wcrpanluaazyzdxe5cdlyqqgyx4459w2vnnc674rqjs4gsugmlar4gt3ll92ltlqusp0wwx",
    ],
    ["t", "@父親"],
    ["t", "dankogai"],
    ["t", "サークル名由来話"],
    ["t", "イベント告知"],
    ["t", "届け♪"],
    ["t", "素晴らしいSPARKING"],
    ["t", "ユズナー"],
    ["t", "脱出済み"],
    ["t", "もうだめぽ"],
    ["t", "水ダウ"],
    ["t", "ないサイコー本"],
    ["t", "にくい紙幣肖像"],
    ["t", "興味"],
    ["t", "ミュート"],
    ["t", "よぃーー"],
    ["t", "の子"],
    ["t", "Party"],
    ["t", "無料"],
    ["t", "練馬区民"],
    ["t", "147"],
    ["t", "ライトニングウォレット"],
    ["t", "投票権"],
    ["t", "nostter,Amethist"],
    ["t", "申し訳なく人"],
    ["t", "すゝめ"],
    ["t", "もろ"],
    ["t", "修正資本主義"],
    ["t", "法定休日"],
    ["t", "少ない見かけ"],
    ["t", "クリプト払い"],
    ["t", "隕石"],
    ["t", "ない投票"],
    ["t", "早いライブ配信参加"],
    ["t", "著作権"],
    ["t", "Lightning"],
    ["t", "早いログインリレー"],
    ["t", "なかっ矢継ぎ早発表"],
    ["t", "10年前"],
    ["t", "ぅぉちぱしよや"],
    ["t", "早いedenlandmilou.lol最後nostricaイベント3月19日"],
    ["t", "意識調査"],
    ["t", "素晴らしい個性表現"],
    ["t", "申し訳なく警察"],
    ["t", "肌ツルスベ"],
    ["t", "楽し緊張"],
    ["t", "瞑想"],
    ["t", "ない人生"],
    ["t", "破壊"],
    ["t", "jack"],
    ["t", "宇多田"],
    ["t", "微博上的兰大那是通缩死忠粉"],
    ["t", "特番"],
    ["t", "明るい周知の事実"],
    ["t", "政策"],
    ["t", "トイレ"],
    ["t", "見出し"],
    ["t", "コスパ悪"],
    ["t", "グリコ"],
    ["t", "変態"],
    ["t", "大学"],
    ["t", "上坂すみれ"],
    ["t", "偽造防止"],
    ["t", "kogaiさん"],
    ["t", "ダサく他国"],
    ["t", "プーチンさん"],
    ["t", "ふつう"],
    ["t", "+"],
    ["t", "なかっ市場"],
    ["t", "天ぷら"],
    ["t", "ｸﾞｴ..."],
    ["t", "Darms"],
    ["t", "いいんじゃない"],
    ["t", "とっとこハム太郎"],
    ["t", "高校話"],
    ["t", "いいしそつ"],
    ["t", "イメージ"],
    ["t", "裏"],
    ["t", "いい一回きりの人生"],
    ["t", "確認"],
    ["t", "ﾀｺ部分"],
    ["t", "苦情"],
    ["t", "GLAYRockon"],
    ["t", "ノート"],
    ["t", "ギットコハム太郎"],
    ["t", "名前"],
    ["t", "野球"],
    ["t", "立候補"],
    ["t", "出走"],
    ["t", "ないコスプレしながら土下座謝罪"],
    ["t", "怖い"],
    ["t", "苗字"],
    ["t", "とうふさん"],
    ["t", "分からん"],
    ["t", "apex4人目募集中"],
    ["t", "フロントエンド"],
    ["t", "[監視ｼｽﾃﾑ]ﾖﾘ発報"],
    ["t", "YouTube"],
    ["t", "いい知識受け売り"],
    ["t", "耳"],
    ["t", "マジで訴訟"],
    ["t", "バ美肉紙幣"],
    ["t", "20"],
    ["t", "かやり"],
    ["t", "宜しくバグ"],
    ["t", "少ない感じ"],
    ["t", "式民精神"],
    ["t", "事"],
    ["t", "投稿"],
    ["t", "リクエスト"],
    ["t", "文句"],
    ["t", "早いあとnip-5アカウント認証"],
    ["t", "怎么"],
    ["t", "音量"],
    ["t", "早いにもcoracle.social,snortiris.toastralninjaetc..."],
    ["t", "布団"],
    ["t", "ない?"],
    ["t", "自体"],
    ["t", "デレ"],
    ["t", "ダサくユーロ"],
    ["t", "世の中"],
    ["t", "いいCVE解説"],
    ["t", "納税義務"],
    ["t", "素晴らしいオブジェ"],
    ["t", "楽しノスターちゃん"],
    ["t", "スマホアプリ"],
    ["t", "早いwallet"],
    ["t", "なまきょ"],
    ["t", "Imazu"],
    ["t", "招待制"],
    ["t", "disable"],
    ["t", "早いdamus"],
    ["t", "選挙権行使"],
    ["t", "神"],
    ["t", "みんなの運動量"],
    ["t", "fail!"],
    ["t", "統計"],
    ["t", "謎"],
    ["t", "過程"],
    ["t", "複数"],
    ["t", "クライアント"],
    ["t", "公開鍵"],
    ["t", "定期的"],
    ["t", "BotFightMode"],
    ["t", "早いコスタリカ"],
    ["t", "理由人"],
    ["t", "主義"],
    ["t", "ダサいキモい"],
    ["t", "ぇわ"],
    ["t", "状況"],
    ["t", "monoさん"],
    ["t", "ねる"],
    ["t", "主張"],
    ["t", "明るい全裸中年男性"],
    ["t", "teams"],
    ["t", "蓮舫"],
    ["t", "ない写真"],
    ["t", "隣人"],
    ["t", "CF"],
    ["t", "就職"],
    ["t", "代"],
    ["t", "ネル"],
    ["t", "新札対応"],
    ["t", "アニメイラスト"],
    ["t", "志望校"],
    ["t", "ﾀｺﾔｷ神"],
    ["t", "プロトコルブリッジ実行"],
    ["t", "保存"],
    ["t", "すごいハイパフォーマンス"],
    ["t", "政治団体政策"],
    ["t", "応援"],
    ["t", "音量3"],
    ["t", "感覚麻痺"],
    ["t", "おさん"],
    ["t", "2020年1月電話"],
    ["t", "えて"],
    ["t", "多いWoS"],
    ["t", "心配"],
    ["t", "slack,"],
    ["t", "Passwordpassword"],
    ["t", "個々"],
    ["t", "分包"],
    ["t", "美味かっ模様"],
    ["t", "サーバ"],
    ["t", "SPARKING"],
    ["t", "ID:"],
    ["t", "無かっそりゃそうだ"],
    ["t", "一時間ごと"],
    ["t", "百合子"],
    ["t", "おいしく紙"],
    ["t", "楽しそう"],
    ["t", "卒業発表"],
    ["t", "能登復興支援ライブ生中継"],
    ["t", "新曲"],
    ["t", "政治的主張"],
    ["t", "藤井フミヤ"],
    ["t", "加藤隆"],
    ["t", "ゃっ"],
    ["t", "ふさわしそう"],
    ["t", "あと2日"],
    ["t", "くりぃむナンタラあるじゃん"],
    ["t", "回収"],
    ["t", "多い雰囲気"],
    ["t", "投票行動"],
    ["t", "SNS"],
    ["t", "早い中国"],
    ["t", "めんどい記名"],
    ["t", "録画ソフト"],
    ["t", "なかっチューナーレス大型テレビ電気自動車ドラム式洗濯機"],
    ["t", "人達"],
    ["t", "候補"],
    ["t", "倉木麻衣年上"],
    ["t", "SocialClub登場"],
    ["t", "ファン"],
    ["t", "コミケ"],
    [
      "e",
      "eaf9ac755d1136e2f3b8334821aae9cf38edb3515b0aa754f8a8e0102191f323",
      "",
      "reply",
    ],
    ["p", "2c7cc62a697ea3a7826521f3fd34f0cb273693cbe5e9310f35449f43622a5cdc"],
    [
      "e",
      "fdd202cd056235a7c79a02e018fc2a310a00a9bddd1329123c4227939f9b8a0b",
      "wss://yabu.me",
      "root",
    ],
    ["t", "バズワードランキング"],
  ],
};
test("", () => {
  const text =
    "test nostr:nevent1qqsxsn5qaa2t6r7cc65lz5yrkslg4q68egzl6lvpc8rzmzpkxl9yjxgvawjvr test https://nostr.com";
  const tags = [
    ["q", "684e80ef54bd0fd8c6a9f15083b43e8a8347ca05fd7d81c1c62d883637ca4919"],
  ];
  expect(parseText(text, tags));
});

test("", () => {
  const text = "₍                ･ᴗ･                 ₎";
  const tags: string[][] = [];
  console.log(parseText(text, tags));
  expect(parseText(text, tags));
});

// test("", () => {
//   const text = event.content;
//   const tags: string[][] = event.tags;
//   console.log(parseText(text, tags));
//   expect(parseText(text, tags));
// });
test("", () => {
  console.log(parseText(testcontent, []));
  expect(parseText(testcontent, []));
});
