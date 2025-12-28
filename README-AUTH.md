# Настройка Supabase Auth с Google

## Шаги настройки

### 1. Настройка Google OAuth в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Перейдите в **APIs & Services** → **Credentials**
4. Нажмите **Create Credentials** → **OAuth client ID**
5. Выберите **Web application**
6. Добавьте **Authorized redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   (Замените `your-project-ref` на ваш Supabase project reference)
7. Скопируйте **Client ID** и **Client Secret**

### 2. Настройка в Supabase Dashboard

1. Откройте ваш проект в [Supabase Dashboard](https://app.supabase.com/)
2. Перейдите в **Authentication** → **Providers**
3. Найдите **Google** и включите его
4. Вставьте:
   - **Client ID** (из Google Cloud Console)
   - **Client Secret** (из Google Cloud Console)
5. Сохраните изменения

### 3. Настройка переменных окружения

Добавьте в `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Где найти:
- **Project URL** и **anon key**: Settings → API
- **service_role key**: Settings → API (секретный ключ)

### 4. Настройка Redirect URL

В Supabase Dashboard:
1. **Authentication** → **URL Configuration**
2. Добавьте ваш домен в **Site URL**:
   - Для разработки: `http://localhost:3000`
   - Для продакшена: ваш домен

3. Добавьте **Redirect URLs**:
   ```
   http://localhost:3000/api/auth/callback
   https://yourdomain.com/api/auth/callback
   ```

## Как это работает

1. Пользователь нажимает "Войти через Google" на `/login`
2. Перенаправление на Google для авторизации
3. Google перенаправляет обратно на `/api/auth/callback`
4. Callback обменивает код на сессию
5. Пользователь перенаправляется на главную страницу
6. Middleware защищает все роуты, кроме `/login` и `/api/auth/*`

## Защита роутов

Middleware автоматически:
- Перенаправляет неавторизованных пользователей на `/login`
- Разрешает доступ к `/login` и `/api/auth/*` без авторизации
- Перенаправляет авторизованных пользователей с `/login` на главную

## Получение userId

В компонентах используйте:
```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;
```

В API routes используйте:
```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;
```

