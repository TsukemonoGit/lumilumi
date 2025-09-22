# ステージ1: ビルド環境
FROM node:22.16.0-alpine AS builder

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピーし、npm installを実行
# これはキャッシュを活用するために重要です
COPY package*.json ./
RUN npm install

# ステージ2: 本番環境
FROM node:22.16.0-alpine

# ビルドステージからノードモジュールをコピー
WORKDIR /app
COPY --from=builder /app/node_modules ./

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションがリッスンするポートを公開
# プロジェクトの設定に合わせて変更してください
EXPOSE 3000

# アプリケーションを起動
CMD ["npm", "run", "dev"]