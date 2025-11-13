FROM node:20-alpine AS build
WORKDIR /app

# 仅拷贝包管理文件以便缓存依赖
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm --version && pnpm install --frozen-lockfile

# 拷贝源码并构建
COPY . .
RUN pnpm run build -- --base=/

FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
