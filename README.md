参考

nosvelte
Apache License
Version 2.0, January 2004

https://github.com/akiomik/nosvelte

## 特徴

- kind:10000 の Mute、kind:30007 の Mute by kind に対応。

- 通信量が気になる方のための、画像を表示しない、のモード

  - nip05 のチェックをしない
  - アイコンを表示しない
  - OGP を取得しない
  - カスタム絵文字を表示しない
  - metadata を更新しない (メタデータはフォロー分だけキャッシュしてます)

## 各種設定

### リレー設定

- 各クライアント標準の kind:10002 を使うモード、アプリ固有のリレーを設定するモード (外のす用を固有に設定して外に出るときはそっちに切り替えて使う など)

### リアクション設定

- デフォルトのリアクションを設定できる

### 表示設定

- 画像を表示 ON/OFF

  - ON では、アイコンを表示する、カスタム絵文字、画像、OGP を表示する、nip05 の認証確認するメタデータの更新をチェックする。

- ノート作成時のプレビューの ON/OFF

  - 画像表示 ON のときだけ

- menu ボタンの位置 右下/左下

- 各ノートのユーザーアイコンの下にどのリレーから受信したのかを表示する ON/OFF

- 自分へのリアクションを TL に流す ON/OFF

### データの同期

- mute (kind:10000)

- mute by kind (kind:30007)

- emoji (kind:10030)

更新頻度が多くなさそうなデータは手動で同期を行う。

取得したデータが確認できるので、データの反映状況が確認できる。

### メインメニュー

- home
- notifications
- search

  nip50 に対応したリレーから３リレー選んでいて、そのリレーから結果を取得

- global

  kind:30002 relay sets の dtag が Global のリレーリストから取得

- chat

  kind:10005 public chats を表示

- list

  kind:30000 people sets を表示

- settings

- profile

#### キーボードショートカット

- n キーで ノート入力画面を開く

- ノート入力画面で
  - Ctrl+Enter キー で投稿
  - Esc キー( 多分 2 回入力くらい) で入力画面を閉じる
