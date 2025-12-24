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
docker compose up --build
```

- **`--build`** は Dockerfile の変更を反映するために初回や構成変更時に必要です。2回目以降は `docker compose up` だけで起動できます。
- コンテナが起動すると、自動的に `npm run dev` が実行されます。
- ブラウザで `http://localhost:5173/` にアクセスして確認してください。

---

#### 3\. コンテナ内でコマンドを実行する場合

コンテナ内のシェルに入って作業する場合（例：パッケージの追加など）：

```bash
docker compose exec lumilumi sh
```

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
