FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm install

COPY . .

EXPOSE 4000 5173

CMD ["npm", "run", "dev"]
