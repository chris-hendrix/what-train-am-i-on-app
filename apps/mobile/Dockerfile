FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install web dependencies
RUN npx expo install react-dom react-native-web @expo/metro-runtime

# Copy source code
COPY . .

# Expose ports for Metro and web
EXPOSE 19000 19006

# Start the development server with web interface
CMD ["npm", "run", "web"]