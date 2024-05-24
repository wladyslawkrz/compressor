FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn add sharp --ignore-engines
RUN yarn

COPY . .

RUN yarn build

EXPOSE 3009

CMD ["yarn", "start:prod"]