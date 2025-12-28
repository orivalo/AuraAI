"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Circle, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

export default function TasksPanel() {
  const { t, language } = useLanguage();
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setError(t("tasks.error"));
        return;
      }

      // Получаем задачи на сегодня
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString())
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTasks(data || []);
    } catch (err: any) {
      console.error("Ошибка при загрузке задач:", err);
      setError(err.message || "Не удалось загрузить задачи");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleGenerateTasks = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ language }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка при генерации задач");
      }

      const data = await response.json();

      if (data.success && data.tasks) {
        setTasks(data.tasks);
      } else {
        throw new Error(data.error || "Не удалось сгенерировать задачи");
      }
    } catch (err: any) {
      console.error("Ошибка при генерации задач:", err);
      setError(err.message || "Не удалось сгенерировать задачи");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return;
      }

      // Оптимистичное обновление UI
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: !currentCompleted } : task
        )
      );

      // Обновляем в базе данных
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ completed: !currentCompleted })
        .eq("id", taskId)
        .eq("user_id", session.user.id);

      if (updateError) {
        // Откатываем изменение при ошибке
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, completed: currentCompleted } : task
          )
        );
        throw updateError;
      }
    } catch (err: any) {
      console.error("Ошибка при обновлении задачи:", err);
      setError(err.message || t("tasks.error"));
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="w-full h-full bg-white rounded-3xl shadow-xl shadow-[#A4B494]/10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#A4B494]/20 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#7C9070]">{t("tasks.title")}</h2>
            {totalCount > 0 && (
              <p className="text-xs text-[#A4B494]/70 mt-1">
                {t("tasks.completed")}: {completedCount} {t("tasks.of")} {totalCount}
              </p>
            )}
          </div>
          <button
            onClick={handleGenerateTasks}
            disabled={isGenerating}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200",
              "bg-[#7C9070] text-white hover:bg-[#7C9070]/90",
              "shadow-md shadow-[#7C9070]/20 hover:shadow-lg hover:shadow-[#7C9070]/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("tasks.generating")}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t("tasks.generate")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#7C9070] animate-spin" />
              <p className="text-sm text-[#A4B494]/70">{t("tasks.loading")}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-red-500 mb-4">{error}</p>
              <button
                onClick={loadTasks}
                className="px-4 py-2 rounded-2xl bg-[#7C9070] text-white text-sm font-medium hover:bg-[#7C9070]/90 transition-colors"
              >
                {t("tasks.retry")}
              </button>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <Sparkles className="w-12 h-12 text-[#A4B494]/50 mx-auto mb-4" />
              <p className="text-sm text-[#7C9070] font-medium mb-2">
                {t("tasks.empty")}
              </p>
              <p className="text-xs text-[#A4B494]/70 mb-4">
                {t("tasks.emptyDescription")}
              </p>
              <button
                onClick={handleGenerateTasks}
                disabled={isGenerating}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 mx-auto",
                  "bg-[#7C9070] text-white hover:bg-[#7C9070]/90",
                  "shadow-md shadow-[#7C9070]/20 hover:shadow-lg hover:shadow-[#7C9070]/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("tasks.generating")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t("tasks.generate")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-2xl transition-all duration-200",
                  "border border-[#A4B494]/20 hover:border-[#A4B494]/40",
                  "bg-white hover:bg-[#F1F4F0]/50",
                  task.completed && "opacity-60"
                )}
              >
                <button
                  onClick={() => handleToggleTask(task.id, task.completed)}
                  className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
                  aria-label={task.completed ? "Отметить как невыполненное" : "Отметить как выполненное"}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-[#7C9070]" />
                  ) : (
                    <Circle className="w-6 h-6 text-[#A4B494]" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm leading-relaxed",
                      task.completed
                        ? "text-[#A4B494] line-through"
                        : "text-[#7C9070]"
                    )}
                  >
                    {task.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

