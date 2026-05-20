"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercent?: boolean;
}

export function ProgressBar({
  current,
  total,
  label,
  showPercent = true,
}: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="w-full space-y-2">
      {(label || showPercent) && (
        <div className="flex justify-between text-sm text-slate-400">
          <span>{label ?? "Progreso"}</span>
          {showPercent && <span className="font-mono font-semibold text-indigo-300">{pct}%</span>}
        </div>
      )}
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
