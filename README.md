# Task Tracker

Таск-трекер с ролями, проектами, задачами, кэшированием в Redis, очередями RabbitMQ и развёртыванием в
Kubernetes.

## Стек технологий

| Слой           | Технология                                    |
|:---------------|:----------------------------------------------|
| Backend        | PHP 8.4 + Symfony 7.4                         |
| Frontend       | React + TypeScript                            |
| База данных    | PostgreSQL 16                                 |
| Кэш            | Redis 7.4                                     |
| Очереди        | RabbitMQ 4                                    |
| Инфраструктура | Docker, Docker Compose, Kubernetes (Minikube) |
| Почта (dev)    | Mailpit                                       |

## Функционал

- **Аутентификация и авторизация** — JWT + refresh, глобальные роли (admin / user), RBAC через Symfony Voters.
- **Проекты** — создание, редактирование, удаление, управление участниками (добавление, смена роли, удаление).
- **Задачи** — создание, редактирование, смена статуса, назначение исполнителя, дедлайны, теги, комментарии, вложения.
- **Доска задач** — задачи в проекте, «Мои задачи» (вкладки «Назначенные мне» и «Мои постановки»).
- **Кэширование** — списки проектов и задач кэшируются в Redis (TTL 60 секунд). Кэш сбрасывается при создании,
  редактировании и удалении.
- **Очереди** — уведомления о назначении задачи и о переходе в статус «На проверку» отправляются через RabbitMQ (Symfony
  Messenger).
- **Поиск** — полнотекстовый поиск по задачам через PostgreSQL FTS.

## Модель ролей

В проекте две независимые системы ролей:

- **Глобальные роли пользователя** — `admin` и `user`. Определяют доступ к административным разделам системы (управление
  пользователями и т.п.).
- **Роли участника внутри проекта** — назначаются при добавлении пользователя в проект (owner / manager / developer /
  viewer). Определяют права на редактирование проекта, управление участниками и работу с задачами.

Эти системы не пересекаются: один и тот же пользователь может быть `user` глобально, но `owner` в одном проекте и
`viewer` в другом. Проверка прав реализована через Symfony Voters (`ProjectVoter`, `TaskVoter`), которые учитывают и
глобальную роль, и роль в конкретном проекте.

## Архитектура

```text
Controller → Service → Repository
↓
CacheInterface (Redis)
↓
MessageBus (RabbitMQ)
```

- **Контроллеры** — принимают запрос, вызывают сервис, возвращают JSON.
- **Сервисы** (`ProjectService`, `TaskService`) — содержат логику кэширования и инвалидации.
- **Репозитории** — работа с БД через Doctrine.
- **Redis** — два пула: `project.cache` и `task.cache`. Ключи вида `user_projects_{id}`, `project_tasks_{id}`,
  `user_assigned_tasks_{id}`, `user_reported_tasks_{id}`.
- **RabbitMQ** — сообщения `TaskNotification` и `TaskReadyForReviewNotification` обрабатываются воркерами.

## Быстрый старт (Docker Compose)

### Требования

- Docker Desktop (Windows / macOS / Linux)
- Git

### Запуск

```bash
git clone https://github.com/ma6e4kaa/task-tracker.git
cd task-tracker
docker compose up -d --build
```

После запуска:

- **API:** http://localhost:8080
- **Frontend:** http://localhost:3000
- **RabbitMQ Management:** http://localhost:15672 (логин: `app`, пароль: `secret`)
- **Mailpit:** http://localhost:8025

### Миграции

```bash
docker compose exec php php bin/console doctrine:migrations:migrate
```

### Остановка

```bash
docker compose down # остановить и удалить контейнеры (данные в volumes сохраняются)
docker compose down -v # остановить и удалить контейнеры вместе с volumes
```

## Kubernetes (Minikube)

Проект также разворачивается в Kubernetes (Minikube).

### Требования

- Minikube
- kubectl
- Docker Desktop

### Запуск

```bash

# 1. Запустить кластер

minikube start --driver=docker

# 2. Загрузить локальные образы в Minikube

minikube image load task-tracker-php:latest
minikube image load task-tracker-frontend:latest

# 3. Применить манифесты

kubectl apply -f k8s/

# 4. Проверить поды

kubectl get pods -n task-tracker

# 5. Пробросить порты (в отдельных окнах терминала)

kubectl port-forward -n task-tracker svc/nginx 8080:80
kubectl port-forward -n task-tracker svc/frontend 3000:3000
```

После этого API доступен на http://localhost:8080, фронтенд — на http://localhost:3000.

### Структура манифестов

```text
k8s/
├── 00-namespace.yaml # namespace task-tracker
├── 01-secrets.yaml # секреты
├── 02-postgres.yaml # PVC + Deployment + Service
├── 03-redis.yaml # Deployment + Service
├── 04-rabbitmq.yaml # Deployment + Service
├── 05-php.yaml # Deployment + Service
├── 06-nginx.yaml # ConfigMap + Deployment + Service
└── 07-frontend.yaml # Deployment + Service
```

**Важно:** в манифестах для PHP и фронтенда используется `imagePullPolicy: Never`, потому что образы загружены локально
в Minikube. Для фронтенда добавлена переменная `BROWSER=none`, чтобы `react-scripts` не пытался открыть браузер внутри
контейнера.

### Остановка

```bash
kubectl delete -f k8s/
minikube stop
```

## Структура проекта

```text
task-tracker/
├── src/
│   ├── Command/              # консольные команды
│   ├── Controller/Api/       # REST API контроллеры
│   ├── Dto/                  # объекты передачи данных (запросы)
│   ├── Entity/               # сущности
│   ├── Message/              # сообщения для RabbitMQ
│   │   └── Handler/          # обработчики сообщений (воркеры)
│   ├── Repository/           # Doctrine репозитории
│   ├── Security/Voter/       # проверка прав доступа
│   ├── Service/              # сервисы (кэширование)
│   └── Kernel.php
├── templates/
│   └── emails/               # Twig-шаблоны писем
├── config/
│   ├── packages/
│   │   ├── cache.yaml        # пулы Redis
│   │   ├── messenger.yaml    # RabbitMQ
│   │   └── ...
│   └── services.yaml         # привязка пулов к сервисам
├── frontend/                 # React + TypeScript
├── docker/                   # Dockerfile, nginx.conf, php.ini
├── k8s/                      # Kubernetes манифесты
├── docker-compose.yml
└── README.md
```

## Переменные окружения

Основные переменные в `.env`:

| Переменная                | Описание          | Пример                                                                    |
|:--------------------------|:------------------|:--------------------------------------------------------------------------|
| `APP_ENV`                 | Окружение Symfony | `dev`                                                                     |
| `APP_SECRET`              | Секрет приложения | `change_me`                                                               |
| `DATABASE_URL`            | DSN PostgreSQL    | `postgresql://app:secret@postgres:5432/app?serverVersion=16&charset=utf8` |
| `REDIS_URL`               | DSN Redis         | `redis://redis:6379`                                                      |
| `MESSENGER_TRANSPORT_DSN` | DSN RabbitMQ      | `amqp://app:secret@rabbitmq:5672/%2f`                                     |
| `MAILER_DSN`              | DSN почты (dev)   | `smtp://mailpit:1025`                                                     |
| `FRONTEND_URL`            | URL фронтенда     | `http://localhost:3000`                                                   |

