# Build Stage
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install && npm cache clean --force

COPY . .


EXPOSE 6000

CMD ["npm", "start"]
