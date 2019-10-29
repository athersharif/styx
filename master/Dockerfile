FROM node:10.15.3-stretch-slim

RUN mkdir /opt/server
WORKDIR /opt/server

ENV PATH /opt/server/node_modules/.bin:$PATH

COPY server/package.json server/package-lock.json ./

RUN npm install

CMD ["npm", "start"]
