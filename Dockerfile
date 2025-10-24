# Etapa 1: build do React
FROM node:18-alpine AS build

WORKDIR /app

# Copia apenas os arquivos de dependência primeiro (para melhor cache)
COPY package*.json ./
RUN npm ci --only=production

# Copia o restante e faz o build
COPY . .
RUN npm run build

# Etapa 2: servidor Nginx
FROM nginx:alpine

# Copia configuração customizada do nginx (opcional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Copia o build
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]