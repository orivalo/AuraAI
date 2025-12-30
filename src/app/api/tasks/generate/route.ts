import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { createServerClient } from "@supabase/ssr";
import { taskGenerationRequestSchema, sanitizeError } from "@/lib/validation";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const TASKS_GENERATION_PROMPT_EN = `You are a personal assistant that creates motivating and realistic daily tasks.

Based on the user's mood analysis and conversation context, create 3-5 personalized tasks for today. Tasks should be:
- Specific and achievable
- Suitable for the user's current emotional state
- Motivating and supportive
- Realistic in scope

Return ONLY a JSON array of strings, without additional explanations:
["Task 1", "Task 2", "Task 3"]

Example response:
["Take a 20-minute walk in the fresh air", "Drink a glass of water and take a 5-minute break", "Write down 3 things I'm grateful for today"]`;

const TASKS_GENERATION_PROMPT_RU = `Ты персональный помощник, который создает мотивирующие и реалистичные задачи на день.

На основе анализа настроения пользователя и контекста его общения, создай 3-5 персональных задач на сегодня. Задачи должны быть:
- Конкретными и выполнимыми
- Подходящими под текущее эмоциональное состояние пользователя
- Мотивирующими и поддерживающими
- Реалистичными по объему

Верни ТОЛЬКО список задач в формате JSON массива строк, без дополнительных объяснений:
["Задача 1", "Задача 2", "Задача 3"]

Пример ответа:
["Прогуляться на свежем воздухе 20 минут", "Выпить стакан воды и сделать 5-минутную паузу", "Записать 3 вещи, за которые я благодарен сегодня"]`;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, {
      windowMs: 60000, // 1 minute
      maxRequests: 10, // 10 requests per minute (more expensive operation)
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
          },
        }
      );
    }

    const response = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const forwardCookies = (res: NextResponse) => {
      response.cookies.getAll().forEach((cookie) => {
        res.cookies.set(cookie.name, cookie.value, cookie);
      });
      return res;
    };

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return forwardCookies(
        NextResponse.json({ error: "Authorization required" }, { status: 401 })
      );
    }

    const userId = user.id;

    // Validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return forwardCookies(
        NextResponse.json(
          { error: "Invalid request format" },
          { status: 400 }
        )
      );
    }

    const validationResult = taskGenerationRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return forwardCookies(
        NextResponse.json(
          { error: "Invalid request data" },
          { status: 400 }
        )
      );
    }

    const { language } = validationResult.data;
    
    const languageName = language === "ru" ? "Russian" : "English";

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not configured");
      return forwardCookies(
        NextResponse.json(
          { error: "Service configuration error" },
          { status: 500 }
        )
      );
    }

    // Получаем последние 7 записей настроения
    const { data: moodEntries, error: moodError } = await supabase
      .from("mood_entries")
      .select("score, created_at, note")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(7);

    if (moodError) {
      console.error("Ошибка при получении записей настроения:", moodError);
    }

    // Получаем последние сообщения из чата для контекста
    const { data: chats, error: chatsError } = await supabase
      .from("chats")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let chatContext = "";
    if (!chatsError && chats) {
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("role, content")
        .eq("chat_id", chats.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!messagesError && messages) {
        chatContext = messages
          .reverse()
          .map((m) => `${m.role === "user" ? "Пользователь" : "Ассистент"}: ${m.content}`)
          .join("\n");
      }
    }

    // Выбираем базовый промпт в зависимости от языка
    const basePrompt = language === "ru" ? TASKS_GENERATION_PROMPT_RU : TASKS_GENERATION_PROMPT_EN;
    
    // Формируем контекст для AI
    const moodLabel = language === "ru" ? "Настроение" : "Mood";
    const noMoodData = language === "ru" ? "Нет данных о настроении" : "No mood data";
    const noChatMessages = language === "ru" ? "Нет сообщений в чате" : "No chat messages";
    const userLabel = language === "ru" ? "Пользователь" : "User";
    const assistantLabel = language === "ru" ? "Ассистент" : "Assistant";
    const contextLabel = language === "ru" ? "Контекст пользователя" : "User context";
    const moodEntriesLabel = language === "ru" ? "Последние записи настроения" : "Recent mood entries";
    const chatMessagesLabel = language === "ru" ? "Последние сообщения из чата" : "Recent chat messages";
    const createTasksLabel = language === "ru" ? "На основе этого контекста создай персональные задачи на сегодня." : "Based on this context, create personalized tasks for today.";
    
    const moodSummary = moodEntries
      ? moodEntries
          .reverse()
          .map((m) => `${moodLabel}: ${m.score}/10 (${m.created_at})`)
          .join("\n")
      : noMoodData;

    const formattedChatContext = chatContext
      ? chatContext
          .split("\n")
          .map((line) => {
            if (line.startsWith("Пользователь:")) {
              return line.replace("Пользователь:", `${userLabel}:`);
            }
            if (line.startsWith("Ассистент:")) {
              return line.replace("Ассистент:", `${assistantLabel}:`);
            }
            return line;
          })
          .join("\n")
      : "";

    const contextPrompt = `${contextLabel}:

${moodEntriesLabel}:
${moodSummary}

${chatMessagesLabel}:
${formattedChatContext || noChatMessages}

${createTasksLabel}`;

    // Формируем промпт с жесткой инструкцией по языку
    const languageInstruction = language === "ru" 
      ? `ВАЖНО: Генерируй задачи СТРОГО на русском языке. Игнорируй язык предыдущих сообщений, если он отличается. Всегда используй русский язык для всех задач.`
      : `IMPORTANT: Generate tasks STRICTLY in English language. Ignore the language of previous messages if it differs. Always use English language for all tasks.`;

    const tasksPromptWithLanguage = `${basePrompt}

${languageInstruction}

Current interface language: ${languageName}. Generate all tasks STRICTLY in ${languageName} language.`;
    
    // Генерируем задачи через Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: tasksPromptWithLanguage,
        },
        {
          role: "user",
          content: contextPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      stream: false,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || "";

    if (!responseText) {
      return forwardCookies(
        NextResponse.json(
          { error: "Пустой ответ от API" },
          { status: 500 }
        )
      );
    }

    // Парсим JSON из ответа
    let tasksArray: string[] = [];
    try {
      // Пытаемся найти JSON массив в ответе
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tasksArray = JSON.parse(jsonMatch[0]);
      } else {
        // Если JSON не найден, пытаемся парсить весь ответ
        tasksArray = JSON.parse(responseText);
      }

      if (!Array.isArray(tasksArray) || tasksArray.length === 0) {
        throw new Error("Неверный формат ответа");
      }
    } catch (parseError) {
      console.error("Ошибка при парсинге задач:", parseError);
      console.error("Ответ от API:", responseText);
      // Fallback: создаем задачи из текста
      tasksArray = responseText
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => line.replace(/^[-*•]\s*/, "").trim())
        .filter((line) => line.length > 0)
        .slice(0, 5);
    }

    // Ограничиваем количество задач до 5
    const finalTasks = tasksArray.slice(0, 5);

    // Удаляем старые задачи на сегодня
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await supabase
      .from("tasks")
      .delete()
      .eq("user_id", userId)
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    // Sanitize task titles and save
    const tasksToInsert = finalTasks
      .map((title) => title.trim().replace(/<[^>]*>/g, "")) // Remove HTML tags
      .filter((title) => title.length > 0 && title.length <= 500) // Max 500 chars
      .slice(0, 5) // Max 5 tasks
      .map((title) => ({
        user_id: userId,
        title,
        completed: false,
      }));

    const { data: insertedTasks, error: insertError } = await supabase
      .from("tasks")
      .insert(tasksToInsert)
      .select();

    if (insertError || !insertedTasks) {
      console.error("Ошибка при сохранении задач:", insertError);
      return forwardCookies(
        NextResponse.json(
          { error: "Не удалось сохранить задачи" },
          { status: 500 }
        )
      );
    }

    return forwardCookies(
      NextResponse.json(
        {
          success: true,
          tasks: insertedTasks,
        },
        {
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
          },
        }
      )
    );
  } catch (error: unknown) {
    console.error("Error in task generation API:", error);

    const sanitized = sanitizeError(error);
    return NextResponse.json(
      {
        error: sanitized.message,
        code: sanitized.code,
      },
      { status: 500 }
    );
  }
}

