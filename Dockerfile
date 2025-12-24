FROM node:22.16.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@10.9.2
# プロジェクトの依存関係をインストールする
RUN npm install

# アプリケーションのコードをコンテナにコピーする
COPY . .

ENV HOST=0.0.0.0
EXPOSE 5173

CMD ["npm", "run", "dev"]