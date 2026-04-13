FROM node:22-bookworm-slim

# Install OS dependencies for production
RUN apt-get update && apt-get install -y dumb-init curl && rm -rf /var/lib/apt/lists/*
# Create app directory and data directory, set ownership
WORKDIR /app
RUN mkdir -p /app/data && chown -R 1000:1000 /app

# Switch to the non-root user
USER 1000:1000

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY --chown=1000:1000 package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY --chown=1000:1000 . .

# Build the Vite frontend
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/habits.db

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
