# Dashboard web Mas & Cece Wedding Saving
# Stage 1: build aplikasi Vite
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Jembatan tulis Google Sheet (Apps Script), diisi dari vps/.env lewat docker-compose
ARG VITE_SHEET_WRITE_URL=""
ARG VITE_SHEET_WRITE_TOKEN=""
ENV VITE_SHEET_WRITE_URL=$VITE_SHEET_WRITE_URL     VITE_SHEET_WRITE_TOKEN=$VITE_SHEET_WRITE_TOKEN
RUN npm run build

# Stage 2: sajikan file statis dengan nginx
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
