# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app

# Copy package files for caching
COPY package*.json ./
RUN npm install

# Copy the rest of the source
COPY . .

# Build the project using tsup
RUN npm run build

# Stage 2: Production
FROM node:20-slim AS runner
WORKDIR /app

# Set to production to optimize libraries (like discord.js)
ENV NODE_ENV=production
ENV TZ=Asia/Jakarta

# Copy only the compiled output and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Ensure the data directory exists for your schedule.json
RUN mkdir -p data

# Start the bot
CMD ["node", "dist/index.js"]