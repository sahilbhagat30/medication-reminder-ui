# Stage 1: Build React App
FROM node:20-alpine AS build

WORKDIR /app

# Install frontend dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files and build React app
COPY . .
# Set VITE_API_URL empty so the React app uses the same origin (/api) for fetching
ENV VITE_API_URL=""
RUN npm run build

# Stage 2: Serve with Node.js Express BFF
FROM node:20-alpine

WORKDIR /app

# Copy the Express server code
COPY server/ ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy the built React app from Stage 1 into /dist
WORKDIR /app
COPY --from=build /app/dist ./dist

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start the Express BFF (which also serves the React static files)
WORKDIR /app/server
CMD ["npm", "start"]
