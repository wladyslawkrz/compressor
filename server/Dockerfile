FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn
RUN yarn add sharp --ignore-engines

COPY . .

RUN yarn build

EXPOSE 3010

CMD ["yarn", "start:prod"]