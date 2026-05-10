import { Bot } from "lucide-react";
import { VoiceWave } from "./voice-wave";

export function AiInterviewerAvatar({ speaking }) {
  return (
    <div className="flex w-full flex-col items-center gap-3 sm:w-44">
      <div className={`skillora-avatar-shell ${speaking ? "is-speaking" : ""}`}>
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white/10 text-sky-50 shadow-inner">
          <Bot className="h-12 w-12" strokeWidth={1.8} />
        </div>
      </div>
      <VoiceWave active={speaking} />
      <div className="text-center">
        <p className="text-sm font-semibold text-white">Ora</p>
        <p className="text-xs text-sky-100/70">AI interviewer</p>
      </div>
    </div>
  );
}
