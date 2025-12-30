import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

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

    // Используем service role для полного удаления пользователя
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return forwardCookies(
        NextResponse.json(
          { error: "Service configuration error" },
          { status: 500 }
        )
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Удаляем пользователя из auth.users (это также каскадно удалит все связанные данные благодаря ON DELETE CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Ошибка при удалении пользователя:", deleteError);
      return forwardCookies(
        NextResponse.json(
          { error: "Failed to delete account" },
          { status: 500 }
        )
      );
    }

    return forwardCookies(
      NextResponse.json(
        { success: true, message: "Account deleted successfully" },
        { status: 200 }
      )
    );
  } catch (error: unknown) {
    console.error("Error in delete account API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

