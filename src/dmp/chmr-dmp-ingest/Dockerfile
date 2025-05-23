# Build Stage
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install && npm cache clean --force

COPY . .


EXPOSE 7642

CMD ["npm", "start"]
