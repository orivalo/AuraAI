"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ru";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    "nav.myMind": "My Mind",
    "nav.dailyGoals": "Daily Goals",
    "nav.signOut": "Sign Out",
    "nav.deleteAccount": "Delete Account",
    
    // Chat
    "chat.placeholder": "Write a message...",
    "chat.send": "Send",
    "chat.sending": "Sending...",
    "chat.typing": "Typing...",
    "chat.greeting": "Hello. How are you feeling right now?",
    "chat.empty": "Start a conversation to see messages here",
    "chat.error": "Sorry, an error occurred. Please try again.",
    
    // Tasks
    "tasks.title": "Daily Goals",
    "tasks.completed": "Completed",
    "tasks.of": "of",
    "tasks.generate": "Generate AI Plan",
    "tasks.generating": "Generating...",
    "tasks.empty": "No tasks for today",
    "tasks.emptyDescription": "Click 'Generate AI Plan' to have AI create personalized tasks based on your mood and chat context",
    "tasks.loading": "Loading tasks...",
    "tasks.error": "Failed to load tasks",
    "tasks.retry": "Try again",
    "tasks.newChat": "New Chat",
    "tasks.noChats": "No saved chats",
    
    // Mood Chart
    "mood.title": "Your Calm Pulse",
    "mood.description": "The higher the line, the better your mood (1–10)",
    "mood.loading": "Loading chart...",
    "mood.error": "Failed to load data. Please try later.",
    "mood.empty": "No data yet. Add mood entries.",
    "mood.lastEntries": "Last",
    "mood.entries": "entries",
    "mood.autoUpdate": "Updates automatically",
    "mood.today": "Today",
    "mood.syncing": "Syncing...",
    "mood.startChat": "Start chatting for analysis",
    "mood.live": "Live",
    
    // Chats List
    "chats.newChat": "New Chat",
    "chats.noChats": "No saved chats",
    
    // Login/Auth
    "auth.welcome": "Welcome back",
    "auth.subtitle": "Your personal wellness companion",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.signIn": "Sign In",
    "auth.signInGoogle": "Sign in with Google",
    "auth.signingIn": "Signing in...",
    "auth.dontHaveAccount": "Don't have an account?",
    "auth.createOne": "Create one",
    "auth.terms": "By signing in, you agree to our Terms of Service and Privacy Policy",
    "auth.error": "An error occurred. Please try again.",
    "auth.loginError": "Login error. Please try again.",
    
    // Account
    "account.deleteTitle": "Delete Account",
    "account.deleteWarning": "Are you sure you want to delete your account? This action is irreversible and will permanently delete all your data, including chats, tasks, and mood entries.",
    "account.confirmDelete": "Delete",
    "account.cancel": "Cancel",
    "account.deleting": "Deleting...",
  },
  ru: {
    // Navigation
    "nav.myMind": "Мой разум",
    "nav.dailyGoals": "Цели дня",
    "nav.signOut": "Выйти",
    "nav.deleteAccount": "Удалить аккаунт",
    
    // Chat
    "chat.placeholder": "Напишите сообщение...",
    "chat.send": "Отправить",
    "chat.sending": "Отправка...",
    "chat.typing": "Печатает...",
    "chat.greeting": "Привет. Как ты себя чувствуешь прямо сейчас?",
    "chat.empty": "Начните диалог, чтобы увидеть сообщения здесь",
    "chat.error": "Извините, произошла ошибка. Пожалуйста, попробуйте еще раз.",
    
    // Tasks
    "tasks.title": "Цели дня",
    "tasks.completed": "Выполнено",
    "tasks.of": "из",
    "tasks.generate": "Сформировать AI-план",
    "tasks.generating": "Генерация...",
    "tasks.empty": "Пока нет задач на сегодня",
    "tasks.emptyDescription": "Нажмите 'Сформировать AI-план', чтобы ИИ создал персональные задачи на основе вашего настроения и контекста чата",
    "tasks.loading": "Загрузка задач...",
    "tasks.error": "Не удалось загрузить задачи",
    "tasks.retry": "Попробовать снова",
    "tasks.newChat": "Новый чат",
    "tasks.noChats": "Нет сохраненных чатов",
    
    // Mood Chart
    "mood.title": "Твой пульс спокойствия",
    "mood.description": "Чем выше линия, тем лучше настроение (1–10)",
    "mood.loading": "Загрузка графика...",
    "mood.error": "Не удалось загрузить данные. Попробуйте позже.",
    "mood.empty": "Пока нет данных. Добавьте записи настроения.",
    "mood.lastEntries": "Последние",
    "mood.entries": "записей",
    "mood.autoUpdate": "Обновляется автоматически",
    "mood.today": "Сегодня",
    "mood.syncing": "Синхронизация...",
    "mood.startChat": "Начни общение для анализа",
    "mood.live": "Live",
    
    // Chats List
    "chats.newChat": "Новый чат",
    "chats.noChats": "Нет сохраненных чатов",
    
    // Login/Auth
    "auth.welcome": "Добро пожаловать",
    "auth.subtitle": "Твой личный помощник для психологического благополучия",
    "auth.email": "Email",
    "auth.password": "Пароль",
    "auth.signIn": "Войти",
    "auth.signInGoogle": "Войти через Google",
    "auth.signingIn": "Вход...",
    "auth.dontHaveAccount": "Нет аккаунта?",
    "auth.createOne": "Создать",
    "auth.terms": "Войдя, вы соглашаетесь с условиями использования и политикой конфиденциальности",
    "auth.error": "Произошла ошибка. Попробуйте еще раз.",
    "auth.loginError": "Ошибка при входе. Попробуйте еще раз.",
    
    // Account
    "account.deleteTitle": "Удалить аккаунт",
    "account.deleteWarning": "Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо и навсегда удалит все ваши данные, включая чаты, задачи и записи настроения.",
    "account.confirmDelete": "Удалить",
    "account.cancel": "Отмена",
    "account.deleting": "Удаление...",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Загружаем сохраненный язык из localStorage
    const savedLanguage = localStorage.getItem("aura_language") as Language;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ru")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("aura_language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

