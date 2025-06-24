# Build Stage
FROM node:18-alpine

WORKDIR /app
COPY ./dmz/chmr-report-dispos/package*.json ./
RUN npm install --production

COPY ./dmz/chmr-report-dispos .

COPY ./common/ ./common

EXPOSE 6000

# Run the service
CMD ["node", "index.js"]
