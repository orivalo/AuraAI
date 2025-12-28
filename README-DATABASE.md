# Database Schema для Aura AI

## Таблицы

### 1. `chats`
Хранит сессии чатов пользователей.

**Поля:**
- `id` (UUID, PRIMARY KEY) - уникальный идентификатор чата
- `user_id` (UUID, FOREIGN KEY) - ссылка на пользователя из auth.users
- `created_at` (TIMESTAMP) - дата и время создания

### 2. `messages`
Хранит сообщения в чатах.

**Поля:**
- `id` (UUID, PRIMARY KEY) - уникальный идентификатор сообщения
- `chat_id` (UUID, FOREIGN KEY) - ссылка на чат
- `role` (TEXT) - роль отправителя: 'user' или 'assistant'
- `content` (TEXT) - содержимое сообщения
- `created_at` (TIMESTAMP) - дата и время создания

### 3. `mood_entries`
Хранит записи дневника настроения.

**Поля:**
- `id` (UUID, PRIMARY KEY) - уникальный идентификатор записи
- `user_id` (UUID, FOREIGN KEY) - ссылка на пользователя из auth.users
- `score` (INTEGER) - оценка настроения от 1 до 10
- `note` (TEXT, nullable) - дополнительная заметка
- `created_at` (TIMESTAMP) - дата и время создания

## Установка

### Вариант 1: Через Supabase Dashboard
1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Скопируйте содержимое файла `supabase/migrations/001_create_tables.sql`
4. Выполните запрос

### Вариант 2: Через Supabase CLI
```bash
supabase migration new create_tables
# Скопируйте SQL в созданный файл миграции
supabase db push
```

## Безопасность

Все таблицы используют Row Level Security (RLS):
- Пользователи могут видеть только свои данные
- Пользователи могут создавать только свои записи
- Автоматическое удаление связанных записей при удалении пользователя (CASCADE)

## Индексы

Созданы индексы для оптимизации запросов:
- По `user_id` для быстрого поиска записей пользователя
- По `created_at` для сортировки по дате
- По `chat_id` для быстрого поиска сообщений в чате

