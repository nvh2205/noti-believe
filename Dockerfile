FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:18-alpine AS runner
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install --production --frozen-lockfile
RUN chown -R nestjs:nodejs /app
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
USER nestjs
EXPOSE 3000
CMD ["yarn", "start:prod"]
