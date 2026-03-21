FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Добавь эти две строки
ARG VITE_API_URL
ARG VITE_PY_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PY_URL=$VITE_PY_URL

RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]