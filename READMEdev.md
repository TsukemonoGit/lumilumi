### 開発環境のセットアップ（Docker 使用）

このプロジェクトを Docker コンテナ内で開発する場合、以下の手順に従ってください。

---

#### 1\. 前提条件

- **Docker Desktop** がインストールされていること。Docker Desktop には Docker Compose v2 が含まれています。
- ホスト側でポート `5173` が空いていること（Vite のデフォルトポート）。

---

#### 2\. 開発環境の起動

プロジェクトのルートディレクトリで以下を実行します。

```bash
docker compose up --build -d
```

- **`--build`** は Dockerfile の変更を反映するために必要です。
- **`-d`** はバックグラウンドでコンテナを起動します。
- **コンテナは `npm run dev` を自動で実行しない設定です。** 開発サーバは手動で起動する必要があります。

---

#### 3\. コンテナ内で開発サーバを起動

コンテナ内のシェルに入ります。

```bash
docker compose exec lumilumi sh
```

コンテナ内で依存をインストールして、Vite 開発サーバを起動します。

```sh
npm install
npm run dev -- --host 0.0.0.0
```

- **`--host 0.0.0.0`** を指定すると、コンテナ外からブラウザでアクセス可能になります。
- 起動後、以下の URL で確認可能です：
  - ローカル: `http://localhost:5173/`
  - コンテナ IP: `http://<コンテナIP>:5173/`

---

#### 4\. ソースコードの編集

- `docker-compose.yml` のボリューム設定により、ホスト PC のプロジェクトフォルダを直接編集できます。編集内容はコンテナ内に即座に反映されます。
- `node_modules` はホストとコンテナで共有しないように設定することを推奨します。

---

#### 5\. その他の便利なコマンド

- コンテナを停止する：

<!-- end list -->

```bash
docker compose down
```

- コンテナ内のシェルに入る：

<!-- end list -->

```bash
docker compose exec lumilumi sh
```

- 依存を更新する：

<!-- end list -->

```sh
npm install
```
