ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-alpine
WORKDIR /app
ARG REF
ARG COMMIT_HASH
ENV COMMIT_HASH=$COMMIT_HASH
ARG BUILD_TIME
ENV BUILD_TIME=$BUILD_TIME
RUN echo "export REF=$REF" >> commit_info.txt && echo "export COMMIT_HASH=$COMMIT_HASH" >> commit_info.txt
ADD server ./server
ADD client ./client
ADD package* ./
ADD node_modules ./node_modules
EXPOSE 3000
ENTRYPOINT [ "npm", "start" ]
