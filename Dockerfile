FROM node:22-slim

WORKDIR /app

# Strumenti per compilare moduli nativi (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia sorgenti e compila
COPY . .
RUN npm run build

EXPOSE 8080
CMD ["npm", "start"]
