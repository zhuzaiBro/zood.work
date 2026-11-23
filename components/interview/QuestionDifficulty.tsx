function difficultyClass(difficulty: string | null) {
  if (difficulty === '简单') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  if (difficulty === '中等') return 'bg-amber-50 text-amber-700 ring-amber-100';
  if (difficulty === '困难') return 'bg-rose-50 text-rose-700 ring-rose-100';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

export default function QuestionDifficulty({ difficulty }: { difficulty: string | null }) {
  return (
    <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${difficultyClass(difficulty)}`}>
      {difficulty || '未知'}
    </span>
  );
}
