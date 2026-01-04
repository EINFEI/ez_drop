FROM oven/bun:1 AS builder
WORKDIR /usr/src/app

# Copy dependency files first for better caching
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# --- STAGE 2: Production Server ---
FROM nginx:alpine
# Copy the built files from the builder stage to Nginx's serve directory
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Expose port 80 (Standard for HTTP)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]