FROM node:18-alpine

# Set working directory similar to chmr-dmz-dal
WORKDIR /app

# Copy package files and install dependencies
COPY ./dmz/chmr-report-dispos/package*.json ./
RUN npm install --production

# Copy common directory to the same level as server
COPY ./common/ ./common

# Copy the server code to the server directory
COPY ./dmz/chmr-report-dispos/server/ ./server/

# Run the server file in the server directory
CMD ["node", "server/index.js"]