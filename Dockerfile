FROM node:22.16.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@10.9.2
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
