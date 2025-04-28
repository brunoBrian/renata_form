FROM 776040970523.dkr.ecr.us-east-1.amazonaws.com/node-alpine-20:latest

ARG HASH
RUN echo $HASH

WORKDIR /opt/app

COPY . /opt/app

RUN yarn --silent
RUN yarn build:prd

ENV PORT 5000
EXPOSE 5000

CMD ["yarn", "start"]