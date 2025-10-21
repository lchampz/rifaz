# Dockerfile para Backend
FROM oven/bun:1 as base
WORKDIR /app

# Instalar dependências
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copiar código fonte
COPY . .

# Gerar cliente Prisma
RUN bun run db:generate

# Build da aplicação
RUN bun run build

# Imagem de produção
FROM oven/bun:1-slim
WORKDIR /app

# Instalar apenas dependências de produção
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Copiar código buildado
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma

# Expor porta
EXPOSE 3001

# Comando para iniciar
CMD ["bun", "run", "start"]
