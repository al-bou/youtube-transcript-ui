# Dockerfile
FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 👇 Indique que le port 80 est exposé (nécessaire pour Coolify)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
