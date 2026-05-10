import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link } from "wouter";
import { Mic, MicOff, Send, Star, ChevronRight, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useListInterviews, useSubmitAnswer, getListInterviewsQueryKey } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { AiQuestionCard } from "@/components/interview/ai-question-card";
export default function InterviewSessionPage() {
    const { interviewId } = useParams();
    const id = parseInt(interviewId, 10);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [answer, setAnswer] = useState("");
    const [lastFeedback, setLastFeedback] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState("");
    const recognitionRef = useRef(null);
    const finalTranscriptRef = useRef("");
    const interviews = useListInterviews({ query: { queryKey: getListInterviewsQueryKey() } });
    const submitAnswer = useSubmitAnswer();
    const interview = (interviews.data ?? []).find(i => i.id === id);
    const questions = (interview?.questions ?? []);
    const currentQuestion = questions.find(q => !q.answered);
    const answeredCount = questions.filter(q => q.answered).length;
    const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
    const isCompleted = interview?.status === "completed";
    const speechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    const startVoiceInput = async () => {
        if (!speechRecognition) {
            toast({ title: "Voice input is not supported in this browser", variant: "destructive" });
            return;
        }
        try {
            await navigator.mediaDevices?.getUserMedia?.({ audio: true });
        }
        catch {
            toast({ title: "Microphone permission needed", description: "Allow microphone access in your browser, then try again.", variant: "destructive" });
            return;
        }
        window.speechSynthesis?.cancel();
        recognitionRef.current?.stop?.();
        finalTranscriptRef.current = answer ? `${answer.trim()} ` : "";
        const recognition = new speechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => {
            setIsListening(true);
            setVoiceStatus("Listening... speak clearly near your microphone.");
        };
        recognition.onresult = (event) => {
            let interimTranscript = "";
            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const transcript = event.results[index][0]?.transcript ?? "";
                if (event.results[index].isFinal) {
                    finalTranscriptRef.current += `${transcript.trim()} `;
                }
                else {
                    interimTranscript += transcript;
                }
            }
            setAnswer(`${finalTranscriptRef.current}${interimTranscript}`.trim());
        };
        recognition.onend = () => {
            setIsListening(false);
            setVoiceStatus(finalTranscriptRef.current.trim() ? "Voice captured. Review your transcript before submitting." : "Voice capture stopped. If no text appeared, try Chrome/Edge and check mic permission.");
        };
        recognition.onerror = (event) => {
            const message = event.error === "not-allowed"
                ? "Microphone permission was blocked."
                : event.error === "no-speech"
                    ? "No speech was detected. Try again closer to the mic."
                    : "Voice capture stopped. Please try again.";
            setIsListening(false);
            setVoiceStatus(message);
            toast({ title: "Voice capture issue", description: message, variant: "destructive" });
        };
        recognitionRef.current = recognition;
        recognition.start();
    };
    const stopVoiceInput = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };
    const handleSubmit = () => {
        if (!answer.trim() || !currentQuestion)
            return;
        submitAnswer.mutate({
            interviewId: id,
            data: { questionId: currentQuestion.id, answer: answer.trim() },
        }, {
            onSuccess: (res) => {
                setLastFeedback({ score: res.score, feedback: res.feedback, tips: res.tips });
                setAnswer("");
                queryClient.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
            },
            onError: () => toast({ title: "Failed to submit answer", variant: "destructive" }),
        });
    };
    if (interviews.isLoading)
        return (<AppLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48"/>
        <Skeleton className="h-64 rounded-xl"/>
      </div>
    </AppLayout>);
    return (<AppLayout>
      <div className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.22),transparent_32%),linear-gradient(135deg,#061826_0%,#0f2638_48%,#071520_100%)] p-4 text-white md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link href="/interviews">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4"/>
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold capitalize text-white">SkillOra {interview?.type ?? "Mock"} Interview</h1>
            <p className="text-sm text-sky-100/70">{answeredCount} of {questions.length} questions answered</p>
          </div>
        </motion.div>

        <Progress value={progress} className="h-2 bg-white/10"/>

        <AnimatePresence mode="wait">
          {isCompleted ? (<motion.div key="completed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-green-500/30 bg-green-500/5 text-center">
                <CardContent className="py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4"/>
                  <h2 className="text-xl font-bold mb-2">Interview Complete!</h2>
                  {interview?.score !== null && interview?.score !== undefined && (<div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-500"/>
                      <span className="text-2xl font-bold text-primary">{Math.round(interview.score)}%</span>
                    </div>)}
                  <p className="text-muted-foreground text-sm mb-6">{interview?.feedback}</p>
                  <Link href="/interviews">
                    <Button data-testid="button-back-interviews">Start Another Interview</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>) : (<motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Feedback from last answer */}
              <AnimatePresence>
                {lastFeedback && (<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
                    <Card className="border-sky-300/20 bg-white/10 text-white backdrop-blur-xl">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-yellow-500"/>
                          <span className="font-semibold text-sm">Score: {Math.round(lastFeedback.score)}%</span>
                        </div>
                        <p className="text-sm text-sky-50/80 mb-2">{lastFeedback.feedback}</p>
                        {lastFeedback.tips.length > 0 && (<ul className="text-xs text-sky-50/75 space-y-1">
                            {lastFeedback.tips.map((tip, i) => (<li key={i} className="flex items-start gap-2">
                                <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0"/>{tip}
                              </li>))}
                          </ul>)}
                      </CardContent>
                    </Card>
                  </motion.div>)}
              </AnimatePresence>

              {/* Current question */}
              {currentQuestion ? (<div className="space-y-4">
                  <AiQuestionCard question={currentQuestion.question} category={currentQuestion.category} questionNumber={answeredCount + 1} totalQuestions={questions.length}/>

                  <Card className="border-sky-300/20 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
                  <CardContent className="space-y-4 pt-5">
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-sky-300/20 bg-black/20 p-3">
                      <div>
                        <p className="text-sm font-medium text-white">Your voice answer</p>
                        <p className="text-xs text-sky-100/70">{voiceStatus || (isListening ? "Listening... your transcript appears below." : "Use your microphone to fill the transcript.")}</p>
                      </div>
                      <Button type="button" variant={isListening ? "destructive" : "outline"} size="sm" onClick={isListening ? stopVoiceInput : startVoiceInput} className="gap-2 border-sky-300/30 text-white hover:bg-sky-500/20" data-testid="button-voice-input">
                        {isListening ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}
                        {isListening ? "Stop" : "Speak"}
                      </Button>
                    </div>
                    <Textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Your transcript or typed answer appears here. Use STAR: Situation, Task, Action, Result." rows={6} data-testid="textarea-answer" className="resize-none border-sky-300/20 bg-black/30 text-white placeholder:text-sky-100/45"/>
                    <Button onClick={handleSubmit} disabled={!answer.trim() || submitAnswer.isPending} className="w-full gap-2 bg-primary text-white hover:bg-sky-400" data-testid="button-submit-answer">
                      {submitAnswer.isPending ? (<><Loader2 className="w-4 h-4 animate-spin"/> Evaluating...</>) : (<><Send className="w-4 h-4"/> Submit Answer</>)}
                    </Button>
                  </CardContent>
                </Card>
                </div>) : (<Card>
                  <CardContent className="py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary"/>
                    <p className="text-muted-foreground text-sm">Loading questions...</p>
                  </CardContent>
                </Card>)}

              {/* Questions overview */}
              <Card className="border-sky-300/20 bg-white/10 text-white backdrop-blur-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-sky-100/70 uppercase tracking-wide">Questions Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {questions.map((q, i) => (<div key={q.id} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${q.answered ? "text-sky-100/60" : q.id === currentQuestion?.id ? "font-medium text-white bg-sky-500/10" : "text-sky-100/45"}`} data-testid={`question-status-${q.id}`}>
                        {q.answered ? (<CheckCircle className="w-4 h-4 text-green-500 shrink-0"/>) : q.id === currentQuestion?.id ? (<div className="w-4 h-4 rounded-full border-2 border-primary shrink-0"/>) : (<div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0"/>)}
                        <span className="truncate">Q{i + 1}: {q.question.slice(0, 50)}...</span>
                      </div>))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>)}
        </AnimatePresence>
      </div>
      </div>
    </AppLayout>);
}
