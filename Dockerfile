FROM node:22.16.0-alpine

# 作業ディレクトリの設定
WORKDIR /app

# 依存関係ファイルのコピーとインストール
# package*.jsonとpackage-lock.json (または yarn.lock/pnpm-lock.yaml) のみをコピー
COPY package*.json ./

# npmのバージョン固定が不要であれば削除
RUN npm install -g npm@10.9.2

# プロジェクトの依存関係をインストールする
RUN npm install

# 開発時はソースコードのコピーは不要 (volumesでマウントするため)
# 本番ビルド時はここで COPY . . を復活させる
# COPY . . 

# ネットワーク設定 (ViteやWebpack Dev Serverがコンテナ外からアクセスできるように設定)
ENV HOST=0.0.0.0

# サービスがリッスンするポート
EXPOSE 5173 

# (オプション: 開発サーバーの起動コマンドをCMDに設定)
# CMD ["npm", "run", "dev"]