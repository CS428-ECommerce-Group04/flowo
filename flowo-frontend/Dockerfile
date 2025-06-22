FROM node:18-alpine

RUN corepack enable

WORKDIR /app
COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile
# COPY source
COPY . .

EXPOSE 5173
CMD ["yarn", "dev", "--host"]
