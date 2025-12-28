"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

type MoodPoint = { label: string; score: number };
type State = "loading" | "empty" | "error" | "ready";

export default function MoodChart() {
  const { t, language } = useLanguage();
  const supabase = useMemo(() => createClient(), []);
  const [isMounted, setIsMounted] = useState(false);
  
  const formatLabel = (dateStr: string, index: number) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const locale = language === "ru" ? "ru-RU" : "en-US";
    const month = d.toLocaleDateString(locale, { month: "short" });
    return index === 6 ? t("mood.today") : `${day} ${month}`;
  };
  const [data, setData] = useState<MoodPoint[]>([]);
  const [state, setState] = useState<State>("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cWidth, setCWidth] = useState<number>(0);
  const [cHeight, setCHeight] = useState<number>(0);

  // Update container dimensions when mounted
  useEffect(() => {
    if (!isMounted || !containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        if (width > 0 && height > 0) {
          setCWidth(width);
          setCHeight(height);
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isMounted]);

  const load = async () => {
    setIsRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setState("empty");
        return;
      }

      const { data: moods } = await supabase
        .from("mood_entries")
        .select("score, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(7);

      if (!moods || moods.length === 0) {
        setState("empty");
        return;
      }

      const mapped = [...moods]
        .reverse()
        .map((m, idx) => ({
          label: formatLabel(m.created_at, idx),
          score: Number(m.score),
        }));

      setData(mapped);
      setState("ready");
    } catch (err) {
      setState("error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    load();

    // Включаем Real-time: слушаем изменения в таблице mood_entries
    const channel = supabase
      .channel('realtime_mood')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mood_entries' },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, language, isMounted]);

  return (
    <div className="w-full bg-white rounded-3xl border border-[#A4B494]/30 shadow-sm overflow-hidden flex flex-col">
      {/* Шапка с отступами */}
      <div className="p-5 pb-0 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#7C9070] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7C9070] animate-pulse" />
            {t("mood.title")}
          </h3>
          <p className="text-[11px] text-[#A4B494]">{t("mood.description")}</p>
        </div>
      </div>

      {/* Контейнер графика БЕЗ боковых отступов */}
      <div ref={containerRef} className="relative h-48 w-full mt-4 min-h-[192px]">
        {state === "loading" && (
          <div className="flex items-center justify-center h-full text-[#A4B494] text-[11px] bg-[#F1F4F0]/20">
            {t("mood.syncing")}
          </div>
        )}
        {state === "error" && (
          <div className="flex items-center justify-center h-full text-[#A4B494] text-[11px] bg-[#F1F4F0]/20">
            {t("mood.error")}
          </div>
        )}
        {state === "empty" && (
          <div className="flex items-center justify-center h-full text-[#A4B494] text-[11px] bg-[#F1F4F0]/20">
            {t("mood.startChat")}
          </div>
        )}
        {isMounted && state === "ready" && data.length > 0 && cWidth > 0 && cHeight > 0 && (
          <>
            {/* Слой Recharts для тултипов */}
            <div className="absolute inset-0 z-10">
              <ResponsiveContainer width="100%" height="100%" minHeight={192}>
                <LineChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" hide />
                  <YAxis domain={[0, 10]} hide />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #A4B49430', fontSize: '10px' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="transparent" dot={{ r: 6, fill: "transparent", stroke: "transparent" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Слой SVG (Линия от края до края) */}
            <div className="absolute inset-0 z-0">
              <svg width="100%" height="100%" viewBox={`0 0 ${cWidth} ${cHeight}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="edgeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C9070" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#7C9070" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const w = cWidth;
                  const h = cHeight * 0.7;
                  const offsetY = cHeight * 0.15;
                  const points = data.map((d, i) => ({
                    x: (i / (data.length - 1)) * w,
                    y: offsetY + (1 - (d.score - 1) / 9) * h
                  }));
                  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                  const area = `${path} L ${w} ${cHeight} L 0 ${cHeight} Z`;
                  return (
                    <>
                      <path d={area} fill="url(#edgeGradient)" />
                      <path d={path} fill="none" stroke="#7C9070" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#fff" stroke="#7C9070" strokeWidth={2} />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </>
        )}
      </div>

      {/* Подвал */}
      {state === "ready" && data.length > 0 && (
        <div className="px-5 py-4 border-t border-[#F1F4F0] flex justify-between items-center text-[10px] text-[#A4B494]">
          <span className="uppercase tracking-widest font-bold">
            {t("mood.lastEntries")} {data.length} {t("mood.entries")}
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
            {t("mood.live")}
          </div>
        </div>
      )}
    </div>
  );
}