# Dockerfile para Frontend
FROM node:18-alpine as base
WORKDIR /app

# Instalar dependências
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Imagem de produção com nginx
FROM nginx:alpine
COPY --from=base /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# Expor porta
EXPOSE 3000

# Comando para iniciar
CMD ["nginx", "-g", "daemon off;"]
