# Use the official Node.js image as the base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy the application code
COPY . .

# Copy the environment file for build process
COPY .env.local .env.local

# Build the Next.js application with --no-lint flag to skip ESLint
# TypeScript errors are handled by next.config.ts configuration
# Environment variables are loaded from .env.local file
RUN npm run build -- --no-lint

# Remove development dependencies for smaller production image
# BUT keep TypeScript since it's needed at runtime for next.config.ts
RUN npm prune --production && npm install typescript

# Expose the port the app runs on
EXPOSE 3000

# Define the startup command
CMD ["npm", "start"]