FROM node:lts-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy only package.json files to leverage Docker cache
COPY package.json pnpm-lock.yaml* ./

# Install dependencies and allow lockfile updates
RUN pnpm install --no-frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Install pnpm globally
RUN npm install -g pnpm
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy the data folder containing Excel files
COPY --from=builder --chown=nextjs:nodejs /app/app/data ./app/data

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"] 