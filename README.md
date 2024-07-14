参考

nosvelte
Apache License
Version 2.0, January 2004

https://github.com/akiomik/nosvelte

###

### 画像表示しないモード

- nip05 のチェックをしない
- アイコンを表示しない
- OGP を取得しない
- カスタム絵文字を表示しない
- metadata を更新しない (メタデータはフォロー分だけキャッシュしてます)

### リレー設定

- 各クライアント標準の kind:10002 を使うモード、アプリ固有のリレーを設定するモード (外のす用を固有に設定して外に出るときはそっちに切り替えて使う など)

### プレビュー表示

- カスタム絵文字、画像、OGP のプレビューが表示される。画像 OFF のときは意味ないので表示しない

### データの同期

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
