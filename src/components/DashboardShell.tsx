"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Brain, Target, LogOut, MessageSquare, Menu, X, Activity, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-2xl bg-white/60 border border-[#A4B494]/20">
      <button
        onClick={() => setLanguage("en")}
        className={cn(
          "px-2 py-1 rounded-xl text-xs font-medium transition-all duration-200",
          language === "en"
            ? "bg-[#7C9070] text-white shadow-sm"
            : "text-[#7C9070]/70 hover:text-[#7C9070]"
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("ru")}
        className={cn(
          "px-2 py-1 rounded-xl text-xs font-medium transition-all duration-200",
          language === "ru"
            ? "bg-[#7C9070] text-white shadow-sm"
            : "text-[#7C9070]/70 hover:text-[#7C9070]"
        )}
      >
        RU
      </button>
    </div>
  );
}

const MoodChart = dynamic(() => import("./MoodChart"), {
  ssr: false,
});

const TasksPanel = dynamic(() => import("./TasksPanel"), {
  ssr: false,
});

type MenuItem = {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
};

type Chat = {
  id: string;
  created_at: string;
  preview?: string;
};

const menuItems: MenuItem[] = [
  { id: "chat", labelKey: "nav.myMind", icon: <Brain className="w-5 h-5" /> },
  { id: "goals", labelKey: "nav.dailyGoals", icon: <Target className="w-5 h-5" /> },
];

export default function DashboardShell() {
  const { t, language } = useLanguage();
  const [activeItem, setActiveItem] = useState("chat");
  const [messages, setMessages] = useState<Array<{ id: number; text: string; isUser: boolean }>>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoodDrawerOpen, setIsMoodDrawerOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const getUser = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (cancelled) return;

        const user = session?.user;

        if (error || !user) {
          setAuthReady(true);
          router.replace("/login");
          return;
        }

        setUserId(user.id);
        setUserEmail(user.email || null);

        const savedChatId = localStorage.getItem(`aura_chat_id_${user.id}`);
        if (savedChatId) {
          setChatId(savedChatId);
        }
        setAuthReady(true);
        
        // Загружаем список чатов
        loadChats(user.id);
      } catch (err) {
        if (cancelled) return;
        console.error("Auth check error:", err);
        setAuthReady(true);
        router.replace("/login");
      }
    };

    getUser();

    // Слушаем изменения в аутентификации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
      }
      setAuthReady(true);
    });

    return () => {
      subscription.unsubscribe();
      cancelled = true;
    };
  }, [router, supabase]);

  // Загрузка списка чатов
  const loadChats = async (userId: string) => {
    try {
      setIsLoadingChats(true);
      
      // Получаем список чатов
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select("id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (chatsError) {
        console.error("Ошибка при загрузке чатов:", chatsError);
        return;
      }

      // Для каждого чата получаем превью (первое сообщение пользователя)
      const chatsWithPreview = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const { data: firstMessage } = await supabase
            .from("messages")
            .select("content")
            .eq("chat_id", chat.id)
            .eq("role", "user")
            .order("created_at", { ascending: true })
            .limit(1)
            .single();

          return {
            ...chat,
            preview: firstMessage?.content?.substring(0, 50) || "Новый чат",
          };
        })
      );

      setChats(chatsWithPreview);
    } catch (error) {
      console.error("Ошибка при загрузке чатов:", error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Загрузка сообщений для выбранного чата
  const loadChatMessages = async (selectedChatId: string) => {
    if (!userId) return;
    
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("content, role, created_at")
        .eq("chat_id", selectedChatId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Ошибка при загрузке сообщений:", messagesError);
        return;
      }

      const formattedMessages = (messagesData || []).map((msg, idx) => ({
        id: idx,
        text: msg.content,
        isUser: msg.role === "user",
      }));

      setMessages(formattedMessages);
      setChatId(selectedChatId);
      setActiveItem("chat"); // Переключаем на раздел чата
      setIsMobileMenuOpen(false); // Закрываем сайдбар на мобильных
      localStorage.setItem(`aura_chat_id_${userId}`, selectedChatId);
    } catch (error) {
      console.error("Ошибка при загрузке сообщений:", error);
    }
  };

  // Создание нового чата
  const handleNewChat = () => {
    setChatId(null);
    setMessages([]);
    setActiveItem("chat"); // Переключаем на раздел чата
    setIsMobileMenuOpen(false); // Закрываем сайдбар на мобильных
    if (userId) {
      localStorage.removeItem(`aura_chat_id_${userId}`);
    }
  };

  // Удаление чата
  const handleDeleteChat = async (chatIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем открытие чата при клике на кнопку удаления
    
    if (!userId) return;

    try {
      const response = await fetch("/api/chat/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: chatIdToDelete,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка при удалении чата");
      }

      // Если удаляемый чат был активным, очищаем его
      if (chatId === chatIdToDelete) {
        setChatId(null);
        setMessages([]);
        if (userId) {
          localStorage.removeItem(`aura_chat_id_${userId}`);
        }
      }

      // Обновляем список чатов
      loadChats(userId);
    } catch (error) {
      console.error("Ошибка при удалении чата:", error);
    }
  };

  // Удаление аккаунта
  const handleDeleteAccount = async () => {
    if (!userId) return;

    try {
      setIsDeletingAccount(true);
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка при удалении аккаунта");
      }

      // Выходим из аккаунта и перенаправляем на страницу входа
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error: any) {
      console.error("Ошибка при удалении аккаунта:", error);
      alert(error.message || "Не удалось удалить аккаунт. Попробуйте позже.");
      setIsDeletingAccount(false);
    }
  };

  // Загрузка сообщений при монтировании, если есть сохраненный chatId
  useEffect(() => {
    if (chatId && userId && messages.length === 0) {
      loadChatMessages(chatId);
    }
  }, [chatId, userId]);

  // Авто-скролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Обработка клавиатуры на мобильных устройствах
  useEffect(() => {
    const handleResize = () => {
      // Закрываем мобильное меню при изменении размера экрана
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    // Обработка виртуальной клавиатуры на iOS/Android
    const handleViewportChange = () => {
      // Прокручиваем к input при появлении клавиатуры
      if (inputRef.current && document.activeElement === inputRef.current) {
        setTimeout(() => {
          inputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 300);
      }
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleViewportChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    const userMessageId = Date.now();
    
    // Добавляем сообщение пользователя
    setMessages((prev) => [...prev, { id: userMessageId, text: userMessage, isUser: true }]);
    setInputValue("");
    setIsLoading(true);

    try {
      if (!userId) {
        throw new Error("Пользователь не определен");
      }

      // Отправляем запрос на API (userId теперь берется из сессии на сервере)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { id: userMessageId, text: userMessage, isUser: true }],
          chatId: chatId,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка при отправке сообщения");
      }

      const data = await response.json();

      if (data.success && data.text) {
        // Сохраняем chatId если он был создан
        if (data.chatId && data.chatId !== chatId) {
          setChatId(data.chatId);
          if (userId) {
            localStorage.setItem(`aura_chat_id_${userId}`, data.chatId);
            // Обновляем список чатов
            loadChats(userId);
          }
        }

        // Добавляем ответ ИИ
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), text: data.text, isUser: false },
        ]);
      } else {
        throw new Error(data.error || "Неизвестная ошибка");
      }
    } catch (error: any) {
      console.error("Ошибка:", error);
      // Показываем сообщение об ошибке пользователю
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: t("chat.error"),
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F1F4F0]" suppressHydrationWarning>
        <div className="w-full max-w-sm bg-white/80 border border-[#A4B494]/30 rounded-3xl px-6 py-8 shadow-md shadow-[#A4B494]/15">
          <div className="animate-pulse space-y-3 text-[#7C9070]">
            <div className="h-4 w-28 bg-[#A4B494]/30 rounded-full" />
            <div className="h-4 w-20 bg-[#A4B494]/20 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full bg-[#F1F4F0] overflow-hidden" style={{ height: '100dvh' }}>
      {/* Mobile Top Bar - Fixed Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#A4B494]/20" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-2xl bg-white/60 border border-[#A4B494]/20 text-[#7C9070] shadow-sm"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <h2 className="text-sm font-semibold text-[#7C9070]">
            {activeItem === "chat" ? t("nav.myMind") : t("nav.dailyGoals")}
          </h2>
          <div className="flex items-center gap-2">
            {/* User Avatar - Mobile */}
            {userEmail && (
              <div className="w-8 h-8 rounded-full bg-[#7C9070] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-xs">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsMoodDrawerOpen(true)}
              className="p-2 rounded-2xl bg-white/60 border border-[#A4B494]/20 text-[#7C9070] shadow-sm"
              aria-label="Mood chart"
            >
              <Activity className="w-5 h-5" />
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Mobile Mood Drawer */}
      {isMoodDrawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/30 z-[60]"
            onClick={() => setIsMoodDrawerOpen(false)}
          />
          <div
            className={cn(
              "lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl transition-transform duration-300",
              isMoodDrawerOpen ? "translate-y-0" : "translate-y-full"
            )}
            style={{ maxHeight: '80vh', paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
          >
            <div className="p-4 border-b border-[#A4B494]/20 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#7C9070]">{t("mood.title")}</h3>
              <button
                onClick={() => setIsMoodDrawerOpen(false)}
                className="p-2 rounded-2xl text-[#7C9070] hover:bg-[#F1F4F0] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 60px)' }}>
              <MoodChart />
            </div>
          </div>
        </>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 border-r border-[#A4B494]/20 bg-white/40 backdrop-blur-sm flex flex-col flex-shrink-0 transition-transform duration-300",
          "lg:translate-x-0 lg:static lg:z-auto",
          isMobileMenuOpen
            ? "fixed inset-y-0 left-0 z-50 translate-x-0"
            : "fixed inset-y-0 left-0 z-50 -translate-x-full"
        )}
      >
        {/* User Profile Header */}
        <div 
          className="p-4 flex-shrink-0"
          style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-[#7C9070] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-lg">
                {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#7C9070] truncate">
                {userEmail ? userEmail.split('@')[0] : 'User'}
              </p>
              <p className="text-xs text-[#A4B494]/70 truncate">
                {userEmail || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Divider after profile */}
        <div className="border-t border-[#7C9070]/20 mx-4" />

        {/* Navigation Buttons */}
        <nav className="p-4 space-y-2">
          {/* Language Switcher - Hidden on mobile (shown in top bar) */}
          <div className="hidden lg:flex items-center justify-between mb-2">
            <div className="flex-1" />
            <LanguageSwitcher />
          </div>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveItem(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-3xl transition-all duration-300",
                activeItem === item.id
                  ? "bg-white/80 text-[#7C9070] shadow-md shadow-[#A4B494]/10"
                  : "text-[#7C9070]/70 hover:bg-white/60 hover:text-[#7C9070]"
              )}
            >
              {item.icon}
              <span className="text-sm font-medium">{t(item.labelKey)}</span>
            </button>
          ))}
        </nav>

        {/* Chats List - Always visible */}
        <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* New Chat Button - Always visible */}
              <button
                onClick={handleNewChat}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-2xl transition-all duration-200 text-left mb-2",
                  !chatId
                    ? "bg-white/80 text-[#7C9070] shadow-sm"
                    : "text-[#7C9070]/70 hover:bg-white/60 hover:text-[#7C9070]"
                )}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{t("chats.newChat")}</span>
              </button>
              
              {isLoadingChats ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-[#A4B494]/30 border-t-[#7C9070] rounded-full animate-spin" />
                </div>
              ) : chats.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-[#A4B494]/60">{t("chats.noChats")}</p>
                </div>
              ) : (
                <>
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-2xl transition-all duration-200 group",
                        chatId === chat.id
                          ? "bg-white/80 text-[#7C9070] shadow-sm"
                          : "text-[#7C9070]/70 hover:bg-white/60 hover:text-[#7C9070]"
                      )}
                    >
                      <button
                        onClick={() => loadChatMessages(chat.id)}
                        className="flex-1 flex flex-col gap-1 text-left min-w-0"
                      >
                        <span className="text-xs font-medium truncate">{chat.preview}</span>
                        <span className="text-[10px] text-[#A4B494]/50">
                          {new Date(chat.created_at).toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        className="p-1.5 rounded-xl text-[#A4B494]/50 hover:text-red-500 hover:bg-red-50 transition-all duration-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 flex-shrink-0"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
            {/* Fade gradient at bottom - only visible when scrolled */}
            <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none bg-gradient-to-t from-white/40 via-white/20 to-transparent" />
          </div>

        {/* User Info & Logout - Fixed at bottom */}
        <div 
          className="p-4 border-t border-[#7C9070]/20 flex-shrink-0 bg-white/40"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-3xl text-[#7C9070]/70 hover:bg-white/60 hover:text-[#7C9070] transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">{t("nav.signOut")}</span>
          </button>
          <button
            onClick={() => setIsDeleteAccountModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-3xl text-red-500/70 hover:bg-red-50 hover:text-red-600 transition-all duration-300 mt-2"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-sm font-medium">{t("nav.deleteAccount")}</span>
          </button>
        </div>
      </aside>

      {/* Delete Account Modal */}
      {isDeleteAccountModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => !isDeletingAccount && setIsDeleteAccountModalOpen(false)}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-2xl bg-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-[#7C9070]">
                  {t("account.deleteTitle")}
                </h3>
              </div>
              <p className="text-sm text-[#A4B494]/70 mb-6">
                {t("account.deleteWarning")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteAccountModalOpen(false)}
                  disabled={isDeletingAccount}
                  className="flex-1 px-4 py-3 rounded-2xl text-sm font-medium text-[#7C9070] bg-[#F1F4F0] hover:bg-[#A4B494]/20 transition-colors disabled:opacity-50"
                >
                  {t("account.cancel")}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 px-4 py-3 rounded-2xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingAccount ? t("account.deleting") : t("account.confirmDelete")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden p-4 lg:p-8 gap-4 lg:gap-8 min-w-0">
        {activeItem === "chat" && (
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[2fr_1.2fr] gap-4 lg:gap-6 h-full mx-auto">
            {/* Chat Container */}
            <div className="h-full w-full bg-white rounded-3xl shadow-xl shadow-[#A4B494]/10 flex flex-col overflow-hidden min-w-0">
              {/* Chat Header - Hidden on mobile (shown in top bar) */}
              <div className="hidden lg:block p-4 lg:p-6 border-b border-[#A4B494]/20 flex-shrink-0">
                <p className="text-[#7C9070]/80 text-sm font-medium">{t("chat.greeting")}</p>
              </div>

              {/* Chat Messages - scrollable area */}
              <div 
                className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 min-h-0"
                style={{ 
                  paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px) + 30px)',
                  overscrollBehavior: 'none'
                }}
              >
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[#A4B494]/60 text-sm">{t("chat.empty")}</p>
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex animate-fade-in",
                      message.isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-3xl px-5 py-3.5",
                        message.isUser
                          ? "bg-white border border-[#A4B494]/30 text-[#7C9070] rounded-br-sm shadow-sm"
                          : "bg-[#A4B494]/20 text-[#7C9070] rounded-bl-sm"
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="max-w-[70%] rounded-3xl px-5 py-3.5 bg-[#A4B494]/20 text-[#7C9070] rounded-bl-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-[#7C9070]/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 bg-[#7C9070]/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 bg-[#7C9070]/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                        <span className="text-xs text-[#7C9070]/60">{t("chat.typing")}</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Anchor для авто-скролла */}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input - fixed at bottom */}
              <form 
                onSubmit={handleSendMessage} 
                className="p-4 lg:p-6 border-t border-[#A4B494]/20 flex-shrink-0"
                style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
              >
                <div className="flex gap-2 lg:gap-3">
                  <input
                    ref={inputRef}
                    id="chat-message-input"
                    name="message"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t("chat.placeholder")}
                    disabled={isLoading}
                    autoComplete="off"
                    className="flex-1 px-4 lg:px-5 py-3 lg:py-3.5 rounded-3xl border border-[#A4B494]/30 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#A4B494]/30 focus:border-[#A4B494]/50 text-sm text-[#7C9070] placeholder:text-[#A4B494]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 lg:px-6 py-3 lg:py-3.5 bg-[#7C9070] text-white rounded-3xl hover:bg-[#7C9070]/90 transition-all duration-200 text-sm font-medium shadow-md shadow-[#7C9070]/20 hover:shadow-lg hover:shadow-[#7C9070]/30 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {isLoading ? t("chat.sending") : t("chat.send")}
                  </button>
                </div>
              </form>
            </div>

            {/* Mood Chart - Hidden on mobile, visible on desktop */}
            <div className="hidden lg:block w-full h-full">
              <MoodChart />
            </div>
          </div>
        )}

        {activeItem === "goals" && (
          <div className="w-full max-w-4xl h-full mx-auto flex flex-col">
            <TasksPanel />
          </div>
        )}
      </main>
    </div>
  );
}

