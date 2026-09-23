FROM node:22-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы
COPY . .

EXPOSE 3000

# Запускаем dev-сервер, доступный снаружи
CMD ["npm", "start"]
