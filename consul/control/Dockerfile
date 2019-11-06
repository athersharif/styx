FROM consul:latest

RUN apk update && apk add nodejs npm g++ make python -y

RUN mkdir /opt/server
WORKDIR /opt/server

ENV PATH /opt/server/node_modules/.bin:$PATH

COPY server/package.json server/package-lock.json ./

RUN npm install --silent

EXPOSE 8500