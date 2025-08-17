# Use Node.js 18 Alpine
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ && rm -rf /var/cache/apk/*

COPY package*.json ./

RUN npm install

# Install ts-node-dev for dev mode
RUN npm install -g ts-node-dev

# Mount src at runtime instead of building
CMD ["ts-node-dev", "--respawn", "--transpile-only", "src/server.ts"]
