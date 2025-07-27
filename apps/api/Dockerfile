FROM node:20-alpine

WORKDIR /app

# Copy API package files
COPY apps/api/package*.json ./
RUN npm pkg delete dependencies.@what-train/shared && npm install

# Copy the API code
COPY apps/api/index.ts ./

EXPOSE 3000

CMD ["npm", "run", "dev"]