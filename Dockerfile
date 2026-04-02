# YallaRent API + Portal
FROM node:22-slim

WORKDIR /app

# Install root dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Install and build portal
COPY portal/package.json portal/package-lock.json ./portal/
RUN cd portal && npm install
COPY portal/ ./portal/
RUN cd portal && npm run build

# Copy backend source
COPY src/ ./src/
COPY migrations/ ./migrations/

EXPOSE 3000
CMD ["node", "src/index.js"]
