FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Next inlines NEXT_PUBLIC_* at build time, so the public realtime URL must be known here.
ARG NEXT_PUBLIC_REALTIME_URL
ENV NEXT_PUBLIC_REALTIME_URL=$NEXT_PUBLIC_REALTIME_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
# Stored times are UTC, and the app converts with the city's zone, never the machine's.
ENV TZ=UTC
# The whole app is copied, dev dependencies included: the realtime process runs through tsx.
COPY --from=build --chown=node:node /app ./
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000 4000
# One image, two processes: compose starts `npm start` (web) and `npm run realtime` (chat).
CMD ["npm", "start"]
