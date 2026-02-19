FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY server/package*.json ./server/
RUN cd server && npm install --production

COPY client/package*.json ./client/
RUN cd client && npm install

COPY client ./client
RUN cd client && npm run build

COPY server ./server

RUN mkdir -p /app/server/uploads/covers /app/server/uploads/novels /app/server/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

WORKDIR /app/server

CMD ["node", "src/index.js"]
