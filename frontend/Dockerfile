# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Set npm config to avoid I/O errors on low-memory systems
ENV NODE_OPTIONS=--max_old_space_size=1024
ENV CI=false

COPY package.json .
RUN npm install --legacy-peer-deps --prefer-offline
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
