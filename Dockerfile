FROM node:lts-alpine3.20 AS build

RUN corepack enable

COPY . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

RUN pnpm build:web

FROM nginx:stable-alpine-slim AS production

COPY --from=build /out /usr/share/nginx/html

