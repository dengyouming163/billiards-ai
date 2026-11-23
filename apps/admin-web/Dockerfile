FROM docker.m.daocloud.io/library/node:20-slim AS builder

RUN npm config set registry https://registry.npmmirror.com && npm install -g pnpm@9

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_AGENT_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_AGENT_BASE_URL=${NEXT_PUBLIC_AGENT_BASE_URL}

RUN pnpm run build


FROM docker.m.daocloud.io/library/node:20-slim

WORKDIR /app

COPY --from=builder /app /app

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "exec", "next", "start", "-p", "3000"]
