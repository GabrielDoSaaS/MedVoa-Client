# Etapa 1: build do React
FROM node:18 AS build

# Diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Faz o build da aplicação
RUN npm run build

# Etapa 2: servidor Nginx para servir o app estático
FROM nginx:alpine

# Copia o build para o diretório padrão do Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expõe a porta 80
EXPOSE 80

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]
