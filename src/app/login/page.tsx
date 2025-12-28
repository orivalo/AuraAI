"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-2xl bg-white/60 border border-[#A4B494]/20">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 rounded-xl text-xs font-medium transition-all duration-200 ${
          language === "en"
            ? "bg-[#7C9070] text-white shadow-sm"
            : "text-[#7C9070]/70 hover:text-[#7C9070]"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("ru")}
        className={`px-2 py-1 rounded-xl text-xs font-medium transition-all duration-200 ${
          language === "ru"
            ? "bg-[#7C9070] text-white shadow-sm"
            : "text-[#7C9070]/70 hover:text-[#7C9070]"
        }`}
      >
        RU
      </button>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Проверяем, не залогинен ли пользователь уже
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/");
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        console.error("Ошибка при входе:", error);
        alert(t("auth.loginError"));
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert(t("auth.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F1F4F0] safe-area-inset-top safe-area-inset-bottom">
      {/* Language Switcher - Top Right */}
      <div className="fixed top-4 right-4 z-10" style={{ top: 'calc(1rem + env(safe-area-inset-top, 0px))' }}>
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-[#A4B494]/10 p-6 lg:p-8 space-y-6">
          {/* Logo/Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-[#7C9070]">Aura AI</h1>
            <p className="text-sm text-[#A4B494]">{t("auth.subtitle")}</p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#A4B494]/20"></div>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-[#A4B494]/30 rounded-3xl text-[#7C9070] font-medium hover:bg-[#F1F4F0] hover:border-[#A4B494]/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#7C9070] border-t-transparent rounded-full animate-spin"></div>
                <span>{t("auth.signingIn")}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{t("auth.signInGoogle")}</span>
              </>
            )}
          </button>

          {/* Info */}
          <p className="text-xs text-center text-[#A4B494]/70">
            {t("auth.terms")}
          </p>
        </div>
      </div>
    </div>
  );
}

