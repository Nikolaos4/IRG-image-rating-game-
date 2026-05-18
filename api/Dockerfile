FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

RUN npm ci

COPY . .

RUN npm run db:generate
RUN npm run build

RUN chmod +x entrypoint.sh
ENTRYPOINT [ "./entrypoint.sh" ]
CMD ["npm", "start"]
