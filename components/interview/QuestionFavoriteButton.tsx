"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type QuestionFavoriteButtonProps = {
  questionId: string;
  variant?: "subtle" | "pill";
  className?: string;
};

export default function QuestionFavoriteButton({
  questionId,
  variant = "subtle",
  className = "",
}: QuestionFavoriteButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const buttonClassName =
    variant === "pill"
      ? `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-all ${
          isFavorite
            ? "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100"
            : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        } disabled:cursor-not-allowed disabled:opacity-50 ${className}`
      : `flex items-center gap-1.5 transition-colors ${
          isFavorite ? "text-blue-600 hover:text-blue-700" : "text-gray-500 hover:text-gray-900"
        } disabled:cursor-not-allowed disabled:opacity-50 ${className}`;

  useEffect(() => {
    let cancelled = false;

    async function loadFavorite() {
      const supabase = createClient() as any;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user?.id) {
        setUserId(null);
        setIsLoading(false);
        return;
      }

      setUserId(user.id);
      const { data } = await supabase
        .from("interview_question_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("question_id", questionId)
        .maybeSingle();

      if (!cancelled) {
        setIsFavorite(Boolean(data));
        setIsLoading(false);
      }
    }

    void loadFavorite();

    return () => {
      cancelled = true;
    };
  }, [questionId]);

  const toggleFavorite = async () => {
    if (!userId) {
      setMessage("请先登录后再收藏");
      return;
    }

    setIsLoading(true);
    setMessage("");
    const supabase = createClient() as any;

    if (isFavorite) {
      const { error } = await supabase
        .from("interview_question_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("question_id", questionId);

      if (error) {
        setMessage(error.message || "取消收藏失败");
      } else {
        setIsFavorite(false);
        setMessage("已取消收藏");
      }
    } else {
      const { error } = await supabase
        .from("interview_question_favorites")
        .upsert(
          {
            user_id: userId,
            question_id: questionId,
          },
          { onConflict: "user_id,question_id" }
        );

      if (error) {
        setMessage(error.message || "收藏失败");
      } else {
        setIsFavorite(true);
        setMessage("已收藏到个人中心");
      }
    }

    setIsLoading(false);
    window.setTimeout(() => setMessage(""), 1800);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void toggleFavorite()}
        disabled={isLoading}
        className={buttonClassName}
      >
        <svg
          className="w-5 h-5"
          fill={isFavorite ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        {isFavorite ? "已收藏" : "收藏"}
      </button>

      {message && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-10 whitespace-nowrap rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-lg">
          {message}
        </div>
      )}
    </div>
  );
}
