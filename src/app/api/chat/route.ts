import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { chatRequestSchema, sanitizeError } from "@/lib/validation";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `Ты профессиональный психолог и терапевт с многолетним опытом работы. Твоя задача - помогать людям понимать свои эмоции, чувства и переживания.

Твои принципы работы:
- Проявляй эмпатию и понимание к каждому человеку
- Задавай открытые вопросы, чтобы помочь человеку лучше понять себя
- Используй техники активного слушания
- Предлагай практические советы и упражнения, когда это уместно
- Создавай безопасное пространство для выражения чувств
- Будь терпеливым и не дави на человека
- Используй мягкий, поддерживающий тон
- Помогай людям находить собственные ответы, а не навязывай решения

Твой стиль общения:
- Теплый и дружелюбный
- Профессиональный, но доступный
- Без медицинских терминов, если они не нужны
- На русском языке
- Краткие, но содержательные ответы (2-4 предложения обычно достаточно)

Помни: ты не ставишь диагнозы и не заменяешь профессиональную медицинскую помощь. Если ситуация требует вмешательства специалиста, мягко направь человека к врачу или психотерапевту.`;

const MOOD_ANALYSIS_PROMPT = `Ты эксперт по анализу эмоционального состояния. Проанализируй следующее сообщение пользователя и оцени его настроение по шкале от 1 до 10, где:
- 1-3: Очень плохое настроение, депрессия, сильный стресс
- 4-5: Плохое настроение, тревога, грусть
- 6-7: Нейтральное или слегка позитивное настроение
- 8-9: Хорошее настроение, радость, удовлетворенность
- 10: Отличное настроение, эйфория, счастье

Верни ТОЛЬКО число от 1 до 10, без дополнительных объяснений.`;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, {
      windowMs: 60000, // 1 minute
      maxRequests: 20, // 20 requests per minute
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            "X-RateLimit-Limit": "20",
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
        NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
        )
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

    const validationResult = chatRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return forwardCookies(
        NextResponse.json(
          { error: "Invalid request data" },
          { status: 400 }
        )
      );
    }

    const { messages, chatId, language } = validationResult.data;
    
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

    // Получаем или создаем chat_id
    let currentChatId = chatId;
    if (!currentChatId) {
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({ user_id: userId })
        .select()
        .single();

      if (chatError || !newChat) {
        console.error("Ошибка при создании чата:", chatError);
        return forwardCookies(
          NextResponse.json(
          { error: "Не удалось создать чат" },
          { status: 500 }
          )
        );
      }
      currentChatId = newChat.id;
    }

    // Get last user message for saving
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || !lastUserMessage.isUser) {
      return forwardCookies(
        NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
        )
      );
    }

    // Sanitize message content (basic XSS protection)
    const sanitizedContent = lastUserMessage.text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .trim();
    
    if (!sanitizedContent || sanitizedContent.length === 0) {
      return forwardCookies(
        NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
        )
      );
    }

    // Save user message to database
    const { error: userMessageError } = await supabase
      .from("messages")
      .insert({
        chat_id: currentChatId,
        role: "user",
        content: sanitizedContent,
      });

    if (userMessageError) {
      console.error("Ошибка при сохранении сообщения пользователя:", userMessageError);
      // Продолжаем выполнение, даже если сохранение не удалось
    }

    // Формируем системный промпт с учетом языка интерфейса
    const systemPromptWithLanguage = `${SYSTEM_PROMPT}

ВАЖНО: Отвечай СТРОГО на ${languageName === "Russian" ? "русском" : "английском"} языке. Игнорируй язык предыдущих сообщений, если он отличается от выбранного языка интерфейса. Всегда используй ${languageName === "Russian" ? "русский" : "английский"} язык для ответов, независимо от языка входящих сообщений.

IMPORTANT: Respond STRICTLY in ${languageName} language. Ignore the language of previous messages if it differs from the selected interface language. Always use ${languageName} language for responses, regardless of the language of incoming messages.`;
    
    // Prepare messages for Groq (sanitize all messages)
    const groqMessages = [
      {
        role: "system",
        content: systemPromptWithLanguage,
      },
      ...messages.map((msg: { text: string; isUser: boolean }) => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").trim(),
      })),
    ];

    // Вызываем Groq API для получения ответа
    const completion = await groq.chat.completions.create({
      messages: groqMessages as any,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      stream: false,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    if (!responseText) {
      return forwardCookies(
        NextResponse.json(
        { error: "Пустой ответ от API" },
        { status: 500 }
        )
      );
    }

    // Сохраняем ответ ИИ в базу
    const { error: assistantMessageError } = await supabase
      .from("messages")
      .insert({
        chat_id: currentChatId,
        role: "assistant",
        content: responseText,
      });

    if (assistantMessageError) {
      console.error("Ошибка при сохранении сообщения ИИ:", assistantMessageError);
      // Продолжаем выполнение, даже если сохранение не удалось
    }

    // Анализируем настроение пользователя на основе последнего сообщения
    try {
      const moodAnalysis = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: MOOD_ANALYSIS_PROMPT,
          },
          {
            role: "user",
            content: lastUserMessage.text,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 10,
        top_p: 1,
        stream: false,
      });

      const moodScoreText = moodAnalysis.choices[0]?.message?.content?.trim() || "";
      // Извлекаем число из ответа (может быть "8" или "Оценка: 8" и т.д.)
      const moodScoreMatch = moodScoreText.match(/\d+/);
      const moodScore = moodScoreMatch ? parseInt(moodScoreMatch[0], 10) : null;

      if (moodScore !== null && moodScore >= 1 && moodScore <= 10) {
        // Save mood entry (sanitize note)
        const sanitizedNote = sanitizedContent.substring(0, 100).replace(/[<>]/g, "");
        const { error: moodError } = await supabase
          .from("mood_entries")
          .insert({
            user_id: userId,
            score: moodScore,
            note: `Auto-generated from message: "${sanitizedNote}"`,
          });

        if (moodError) {
          console.error("Ошибка при сохранении записи настроения:", moodError);
          // Не прерываем выполнение, это не критично
        }
      }
    } catch (moodError) {
      console.error("Ошибка при анализе настроения:", moodError);
      // Не прерываем выполнение, анализ настроения не критичен
    }

    // Return response with rate limit headers
    return forwardCookies(
      NextResponse.json(
        {
          text: responseText,
          success: true,
          chatId: currentChatId,
        },
        {
          headers: {
            "X-RateLimit-Limit": "20",
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
          },
        }
      )
    );
  } catch (error: unknown) {
    console.error("Error in chat API:", error);
    
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

