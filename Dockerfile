# Stage 1: Build shared + frontend + backend
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci

COPY shared/ shared/
COPY frontend/ frontend/
COPY backend/ backend/

# Build shared types
RUN npm run build -w @rpg/shared
# Build frontend (same origin, no API URL needed)
RUN npm run build -w @rpg/frontend
# Build backend
RUN npm run build -w @rpg/backend

# Stage 2: Production image
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
RUN npm ci --omit=dev

# Copy built shared types
COPY --from=build /app/shared/dist/ shared/dist/
# Copy built backend
COPY --from=build /app/backend/dist/ backend/dist/
# Copy frontend build into backend/public for static serving
COPY --from=build /app/frontend/dist/ backend/public/

EXPOSE 8080
ENV PORT=8080
CMD ["node", "backend/dist/index.js"]
