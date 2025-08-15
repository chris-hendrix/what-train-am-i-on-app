FROM node:18-alpine

WORKDIR /app

# Copy mobile package files
COPY apps/mobile/package*.json ./

# Remove workspace dependency and install
RUN npm pkg delete dependencies.@what-train/shared && npm install

# Install web dependencies
RUN npx expo install react-dom react-native-web @expo/metro-runtime

# Copy mobile source code
COPY apps/mobile/ .

# Expose ports for Metro and web
EXPOSE 19000 19006

# Start the development server with web interface
CMD ["npm", "start"]