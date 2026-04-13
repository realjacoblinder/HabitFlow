FROM node:24-bookworm-slim

# Create app directory and data directory, set ownership
WORKDIR /app
RUN mkdir -p /app/data

# Install process manager and healthcheck dependency
RUN apt-get update && apt-get install -y curl dumb-init && rm -rf /var/lib/apt/lists/*

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/habits.db

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application with init wrapper
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npm", "start"]
