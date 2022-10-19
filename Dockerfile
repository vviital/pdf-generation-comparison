FROM node:16.15.0-bullseye-slim as builder
WORKDIR /src/app

COPY ./package.json ./package-lock.json ./

RUN npm ci

COPY ./src ./src
COPY ./index.ts ./writer.ts ./tsconfig.json ./

RUN npm run build
RUN npm prune --production

FROM node:16.15.0-bullseye-slim

RUN apt-get update \
    && apt-get install -y  \
      htop \
      fontconfig \
      `apt-cache depends chromium | awk '/Depends:/{print$2}' | awk '!/<xdg-desktop-portal-backend>/'` \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

RUN adduser --system --group pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

COPY --from=builder /src/app /src/app

WORKDIR /src/app

USER pptruser

CMD ["npm", "run", "start:prod"]
