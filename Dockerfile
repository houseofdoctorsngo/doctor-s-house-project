FROM node:22.23.4-bookworm-slim AS build
WORKDIR /app
RUN npm install -g npm@12.2.2
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_SITE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL
RUN npm run build

FROM node:22.23.4-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
