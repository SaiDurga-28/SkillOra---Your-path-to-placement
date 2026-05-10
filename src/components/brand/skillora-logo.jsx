import { Sparkles, Target } from "lucide-react";

export function SkillOraLogo({ compact = false, className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-primary to-teal-500 text-white shadow-[0_12px_32px_rgba(14,165,233,0.24)]">
        <Target className="h-5 w-5" strokeWidth={2.6} />
        <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-sky-100" />
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="text-sm font-black">SkillOra</p>
          <p className="text-[10px] font-medium text-muted-foreground">Your path to placement.</p>
        </div>
      )}
    </div>
  );
}
