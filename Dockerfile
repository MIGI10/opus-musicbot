FROM node:latest

RUN mkdir -p /usr/src/bot

WORKDIR /usr/src
COPY package.json /usr/src
RUN npm install --legacy-peer-deps
ENV NODE_PATH=/usr/src/node_modules

WORKDIR /usr/src/bot

CMD ["node", "index.js"]