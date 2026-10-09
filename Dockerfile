# Stage 1: Build static assets
FROM node:20-alpine AS build

WORKDIR /app

# Build-time config for Vite (VITE_* vars are baked into the bundle at
# build time, not read at runtime -- .env is excluded via .dockerignore,
# so it must come in explicitly as a build ARG instead).
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve compiled assets with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]