ARG BUILD_FROM

# ---------- 1) Compilar el frontend (React + Vite + Tailwind) ----------
FROM node:22-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- 2) Imagen final del add-on ----------
FROM ${BUILD_FROM}
RUN apk add --no-cache nodejs npm
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && apk del npm
COPY server/index.js ./
COPY --from=frontend /app/dist ./public

ENV PORT=8099 DATA_DIR=/data STATIC_DIR=/app/public
CMD ["node", "/app/index.js"]
