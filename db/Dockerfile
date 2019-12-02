FROM postgres:latest

RUN apt-get update && apt-get install nodejs npm consul -y

RUN mkdir -p /consul/config
RUN mkdir /opt/server
WORKDIR /opt/server

ENV PATH /opt/server/node_modules/.bin:$PATH

COPY server/package.json server/package-lock.json ./

RUN npm install --silent