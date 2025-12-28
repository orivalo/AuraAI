import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

const deleteChatSchema = z.object({
  chatId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
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

    const validationResult = deleteChatSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return forwardCookies(
        NextResponse.json(
          { error: "Invalid request data" },
          { status: 400 }
        )
      );
    }

    const { chatId } = validationResult.data;

    // Проверяем, что чат принадлежит пользователю
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id, user_id")
      .eq("id", chatId)
      .single();

    if (chatError || !chat) {
      return forwardCookies(
        NextResponse.json(
          { error: "Chat not found" },
          { status: 404 }
        )
      );
    }

    if (chat.user_id !== userId) {
      return forwardCookies(
        NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        )
      );
    }

    // Удаляем чат (сообщения удалятся автоматически благодаря CASCADE)
    const { error: deleteError } = await supabase
      .from("chats")
      .delete()
      .eq("id", chatId)
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Ошибка при удалении чата:", deleteError);
      return forwardCookies(
        NextResponse.json(
          { error: "Failed to delete chat" },
          { status: 500 }
        )
      );
    }

    return forwardCookies(
      NextResponse.json(
        { success: true, message: "Chat deleted successfully" },
        { status: 200 }
      )
    );
  } catch (error: unknown) {
    console.error("Error in delete chat API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

