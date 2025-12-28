# Переменные окружения для Aura AI

Создайте файл `.env.local` в корне проекта со следующими переменными:

```env
# Groq API
GROQ_API_KEY=your_groq_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Где получить ключи:

### Groq API Key
1. Зарегистрируйтесь на [Groq Console](https://console.groq.com/)
2. Создайте API ключ в разделе API Keys

### Supabase
1. Откройте ваш проект в [Supabase Dashboard](https://app.supabase.com/)
2. Перейдите в Settings → API
3. Скопируйте:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (секретный ключ) → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **ВНИМАНИЕ**: 
- `SUPABASE_SERVICE_ROLE_KEY` - это секретный ключ с полным доступом. Никогда не коммитьте его в Git!
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - публичный ключ, безопасен для использования в клиентском коде

## Аутентификация

⚠️ **ВАЖНО**: В текущей версии используется временный userId из localStorage. 

Для работы с таблицами Supabase (которые ссылаются на `auth.users`) необходимо:

### Вариант 1: Создать тестового пользователя в Supabase
1. Откройте Supabase Dashboard → Authentication → Users
2. Создайте тестового пользователя
3. Скопируйте его UUID
4. Используйте этот UUID как userId (можно временно захардкодить для тестирования)

### Вариант 2: Интегрировать Supabase Auth (рекомендуется для продакшена)
1. Установите `@supabase/auth-helpers-nextjs`
2. Настройте аутентификацию
3. Получайте userId из сессии пользователя

Пример интеграции аутентификации:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const { data: { user } } = await supabase.auth.getUser()
const userId = user?.id
```

**Примечание**: Внешний ключ `user_id` в таблицах ссылается на `auth.users(id)`, поэтому userId должен существовать в таблице пользователей Supabase Auth.

