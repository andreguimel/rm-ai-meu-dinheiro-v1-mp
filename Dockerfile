# Multi-stage build para otimizar a aplicação React
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências com cache otimizado
RUN npm ci --only=production --silent

# Copiar código fonte
COPY . .

# Definir variáveis de ambiente para o build
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_URL
ARG VITE_ALLOW_TRIALS
ARG VITE_APP_URL

ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_ALLOW_TRIALS=$VITE_ALLOW_TRIALS
ENV VITE_APP_URL=$VITE_APP_URL

# Build da aplicação com otimizações
RUN npm run build

# Stage de produção com Nginx otimizado
FROM nginx:1.25-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Remover configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuração otimizada do nginx
COPY nginx-optimized.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados da aplicação
COPY --from=builder /app/dist /usr/share/nginx/html

# Criar diretórios de log
RUN mkdir -p /var/log/nginx

# Definir permissões corretas
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/log/nginx

# Expor porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]

# Healthcheck otimizado para verificar se a aplicação está funcionando
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1