import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth callback error:", error);
    }
  }

  const res = NextResponse.redirect(`${origin}/`);
  // Переносим куки (важно для SSR)
  try {
    const cookieStore = await cookies();
    cookieStore.getAll().forEach((cookie) => {
      res.cookies.set(cookie.name, cookie.value, cookie);
    });
  } catch (err) {
    // если нет доступа к cookies в данном контексте — просто игнорируем
  }
  return res;
}

