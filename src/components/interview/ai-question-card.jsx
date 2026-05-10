import { useEffect, useState } from "react";
import { Mic2, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AiInterviewerAvatar } from "./ai-interviewer-avatar";
import { TypewriterText } from "./typewriter-text";

export function AiQuestionCard({ question, category, questionNumber, totalQuestions }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  const speakQuestion = () => {
    if (!question || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5 sm:flex-row sm:items-center"
    >
      <AiInterviewerAvatar speaking={isSpeaking} />

      <div className="min-w-0 flex-1 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-sky-300/40 bg-sky-500/15 text-sky-50 hover:bg-sky-500/20">
            <Mic2 className="mr-1 h-3 w-3" /> {category}
          </Badge>
          <span className="text-xs font-medium text-sky-100/70">
            Question {questionNumber}/{totalQuestions}
          </span>
        </div>

        <h2 className="min-h-20 text-xl font-semibold leading-relaxed text-white md:text-2xl">
          <TypewriterText text={question} />
        </h2>

        <Button
          type="button"
          onClick={speakQuestion}
          className="gap-2 bg-primary text-white shadow-[0_0_28px_rgba(14,165,233,0.28)] hover:bg-sky-400"
          data-testid="button-speak-question"
        >
          <Volume2 className="h-4 w-4" />
          {isSpeaking ? "Speaking..." : "Speak Question"}
        </Button>
      </div>
    </motion.div>
  );
}
