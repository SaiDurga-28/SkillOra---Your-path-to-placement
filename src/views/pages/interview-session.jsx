import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link } from "wouter";
import { Mic, MicOff, Star, ChevronRight, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { abandonInterviewSession, useListInterviews, useSubmitAnswer, getGetDashboardSummaryQueryKey, getGetSkillBreakdownQueryKey, getGetWeeklyProgressQueryKey, getListInterviewsQueryKey } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { AiQuestionCard } from "@/components/interview/ai-question-card";
const ANSWER_SECONDS = 30;
const AUTO_START_SECONDS = 5;
const LISTEN_AFTER_READING_DELAY_MS = 700;
function liveAnswerFeedback(answer, question = {}) {
    const words = answer.trim().split(/\s+/).filter(Boolean);
    const lowerAnswer = answer.toLowerCase();
    const keywords = [...new Set((question.question ?? "").toLowerCase().match(/[a-z][a-z+#.]{3,}/g) ?? [])]
        .filter(word => !["explain", "would", "your", "with", "what", "about", "tell", "describe", "time"].includes(word))
        .slice(0, 5);
    const keywordHits = keywords.filter(word => lowerAnswer.includes(word)).length;
    const hasStructure = /situation|task|action|result|first|second|finally|because|example|impact|tradeoff|challenge|outcome/i.test(answer);
    const hasExample = /example|project|built|implemented|used|worked|created|handled|improved|reduced|increased/i.test(answer);
    const hasResult = /result|impact|outcome|therefore|so that|which helped|measured|percent|%|users|latency|time/i.test(answer);
    const score = Math.min(95, Math.max(20, Math.round((Math.min(words.length, 100) / 100) * 30) + keywordHits * 8 + (hasStructure ? 22 : 8) + (hasExample ? 18 : 6) + (hasResult ? 12 : 4)));
    const nextTip = !answer.trim()
        ? "Start with a direct answer."
        : !hasStructure
            ? "Add structure: situation, action, and result."
            : !hasExample
                ? "Add one real project or experience example."
                : !hasResult
                    ? "Close with the result or measurable impact."
                    : "Good shape. Keep it concise and relevant.";
    return { score, nextTip, words: words.length, keywordHits };
}
export default function InterviewSessionPage() {
    const { interviewId } = useParams();
    const id = parseInt(interviewId, 10);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [answer, setAnswer] = useState("");
    const [lastFeedback, setLastFeedback] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState("");
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerRemaining, setTimerRemaining] = useState(ANSWER_SECONDS);
    const [autoStartCountdown, setAutoStartCountdown] = useState(AUTO_START_SECONDS);
    const [isReadingQuestion, setIsReadingQuestion] = useState(false);
    const [questionRead, setQuestionRead] = useState(false);
    const [speechDebug, setSpeechDebug] = useState("");
    const recognitionRef = useRef(null);
    const finalTranscriptRef = useRef("");
    const liveTranscriptRef = useRef("");
    const submittedQuestionRef = useRef(null);
    const activeAnswerQuestionRef = useRef(null);
    const shouldListenRef = useRef(false);
    const timerRemainingRef = useRef(ANSWER_SECONDS);
    const interviews = useListInterviews({ query: { queryKey: getListInterviewsQueryKey() } });
    const submitAnswer = useSubmitAnswer();
    const interview = (interviews.data ?? []).find(i => i.id === id);
    const questions = (interview?.questions ?? []);
    const currentQuestion = questions.find(q => !q.answered);
    const answeredCount = questions.filter(q => q.answered).length;
    const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
    const isCompleted = interview?.status === "completed";
    const speechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    const formatTimer = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    const realtimeFeedback = useMemo(() => liveAnswerFeedback(answer, currentQuestion), [answer, currentQuestion]);
    useEffect(() => {
        const abandonActiveInterview = () => abandonInterviewSession(id);
        window.addEventListener("beforeunload", abandonActiveInterview);
        return () => {
            window.removeEventListener("beforeunload", abandonActiveInterview);
            abandonActiveInterview();
            queryClient.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
        };
    }, [id, queryClient]);
    useEffect(() => {
        shouldListenRef.current = false;
        recognitionRef.current?.stop?.();
        activeAnswerQuestionRef.current = null;
        if (currentQuestion?.id && submittedQuestionRef.current !== currentQuestion.id) {
            submittedQuestionRef.current = null;
        }
        setTimerRunning(false);
        setTimerRemaining(ANSWER_SECONDS);
        setAutoStartCountdown(AUTO_START_SECONDS);
        setIsReadingQuestion(false);
        setQuestionRead(false);
        setSpeechDebug("");
        window.speechSynthesis?.cancel?.();
    }, [currentQuestion?.id]);
    useEffect(() => {
        if (!timerRunning)
            return;
        const id = window.setInterval(() => setTimerRemaining(prev => Math.max(0, prev - 1)), 1000);
        return () => window.clearInterval(id);
    }, [timerRunning]);
    useEffect(() => {
        timerRemainingRef.current = timerRemaining;
    }, [timerRemaining]);
    const restartVoiceInput = () => {
        if (!shouldListenRef.current || timerRemainingRef.current <= 1 || !recognitionRef.current)
            return;
        window.setTimeout(() => {
            if (!shouldListenRef.current || timerRemainingRef.current <= 1)
                return;
            try {
                recognitionRef.current?.start();
            }
            catch {
            }
        }, 250);
    };
    const startManualVoiceInput = () => {
        if (!currentQuestion || submitAnswer.isPending)
            return;
        window.speechSynthesis?.cancel?.();
        if (!questionRead) {
            activeAnswerQuestionRef.current = currentQuestion.id;
            setQuestionRead(true);
            setIsReadingQuestion(false);
            setTimerRunning(true);
            setVoiceStatus("Starting microphone...");
            startVoiceInput();
            return;
        }
        setTimerRunning(true);
        startVoiceInput();
    };
    const stopVoiceInput = () => {
        shouldListenRef.current = false;
        recognitionRef.current?.stop?.();
        setIsListening(false);
        setVoiceStatus("Microphone stopped. You can type or restart the mic before time ends.");
    };
    const startAnswerTimerAndMic = () => {
        activeAnswerQuestionRef.current = currentQuestion?.id ?? null;
        setQuestionRead(true);
        setIsReadingQuestion(false);
        setTimerRunning(true);
        setVoiceStatus("Question read. Starting microphone...");
        window.setTimeout(startVoiceInput, LISTEN_AFTER_READING_DELAY_MS);
    };
    const readQuestionThenStart = () => {
        if (!currentQuestion || questionRead || isReadingQuestion)
            return;
        setIsReadingQuestion(true);
        setVoiceStatus("Reading question. Your answer timer starts after the question is read.");
        const text = `Question ${answeredCount + 1}. ${currentQuestion.question}`;
        if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
            window.setTimeout(startAnswerTimerAndMic, 1200);
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-IN";
        utterance.rate = 0.92;
        utterance.pitch = 1;
        utterance.onend = startAnswerTimerAndMic;
        utterance.onerror = startAnswerTimerAndMic;
        window.speechSynthesis.speak(utterance);
    };
    const startVoiceInput = async () => {
        if (!speechRecognition) {
            setVoiceStatus("Voice input is not supported in this browser. Type in the box while the timer runs.");
            setSpeechDebug("SpeechRecognition API missing.");
            setTimerRunning(true);
            return;
        }
        if (!window.isSecureContext) {
            setVoiceStatus("Voice input needs localhost or HTTPS. Type in the box while the timer runs.");
            setSpeechDebug("Page is not a secure context.");
            setTimerRunning(true);
            return;
        }
        try {
            const stream = await navigator.mediaDevices?.getUserMedia?.({ audio: true });
            stream?.getTracks?.().forEach(track => track.stop());
        }
        catch {
            setVoiceStatus("Microphone permission is blocked. Allow mic access in the browser, or type before time ends.");
            setSpeechDebug("Microphone permission denied or unavailable.");
            setTimerRunning(true);
            return;
        }
        window.speechSynthesis?.cancel();
        recognitionRef.current?.stop?.();
        finalTranscriptRef.current = answer ? `${answer.trim()} ` : "";
        liveTranscriptRef.current = answer.trim();
        shouldListenRef.current = true;
        const recognition = new speechRecognition();
        recognition.lang = "en-IN";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.onsoundstart = () => {
            setSpeechDebug("Sound detected. Keep speaking clearly.");
        };
        recognition.onspeechstart = () => {
            setSpeechDebug("Speech detected. Converting words...");
        };
        recognition.onstart = () => {
            setIsListening(true);
            setTimerRunning(true);
            setVoiceStatus("Listening... speak clearly near your microphone.");
            setSpeechDebug("Microphone is active. Waiting for words...");
        };
        recognition.onresult = (event) => {
            let interimTranscript = "";
            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const transcript = event.results[index][0]?.transcript ?? "";
                if (event.results[index].isFinal) {
                    finalTranscriptRef.current += `${transcript.trim()} `;
                }
                else {
                    interimTranscript += `${transcript} `;
                }
            }
            const nextTranscript = `${finalTranscriptRef.current}${interimTranscript}`.trim();
            liveTranscriptRef.current = nextTranscript;
            setAnswer(nextTranscript);
            setSpeechDebug(nextTranscript ? "Words detected." : "Listening, no words detected yet.");
        };
        recognition.onend = () => {
            if (shouldListenRef.current && timerRemainingRef.current > 1) {
                setVoiceStatus(liveTranscriptRef.current ? "Voice captured. Keep speaking until time ends." : "Listening restarted. Speak clearly near the microphone.");
                setSpeechDebug(liveTranscriptRef.current ? "Words detected. Keep answering." : "Listening for your answer...");
                restartVoiceInput();
                return;
            }
            setIsListening(false);
            setVoiceStatus(liveTranscriptRef.current ? "Voice captured. The answer will submit now." : "Voice was not captured. The question will still submit now.");
        };
        recognition.onerror = (event) => {
            const message = event.error === "not-allowed"
                ? "Microphone permission was blocked."
                : event.error === "no-speech"
                    ? "No speech was detected. Try again closer to the mic."
                    : event.error === "network"
                        ? "Speech-to-text service is unavailable. Type in the box while the timer runs."
                        : "Voice capture stopped. Please try again.";
            setVoiceStatus(message);
            setSpeechDebug(`Speech recognition error: ${event.error || "unknown"}.`);
            if (event.error !== "not-allowed" && event.error !== "network") {
                if (shouldListenRef.current && timerRemainingRef.current > 1) {
                    setVoiceStatus("Still listening. Keep speaking clearly near the microphone.");
                    setSpeechDebug("Listening for your answer...");
                }
                restartVoiceInput();
                return;
            }
            if (event.error === "not-allowed") {
                shouldListenRef.current = false;
            }
            setIsListening(false);
        };
        recognitionRef.current = recognition;
        try {
            recognition.start();
        }
        catch {
            setIsListening(false);
            toast({ title: "Voice capture already started", description: "Stop the current capture and try again.", variant: "destructive" });
        }
    };
    const handleSubmit = (forcedAnswer = null) => {
        const questionToSubmit = currentQuestion;
        const answerText = forcedAnswer ?? answer.trim();
        if (!questionToSubmit)
            return;
        if (activeAnswerQuestionRef.current !== questionToSubmit.id)
            return;
        if (submittedQuestionRef.current === questionToSubmit.id)
            return;
        if (!answerText && forcedAnswer === null)
            return;
        submittedQuestionRef.current = questionToSubmit.id;
        recognitionRef.current?.stop();
        shouldListenRef.current = false;
        setIsListening(false);
        setTimerRunning(false);
        submitAnswer.mutate({
            interviewId: id,
            data: { questionId: questionToSubmit.id, answer: answerText || "No answer captured before the timer ended." },
        }, {
            onSuccess: (res) => {
                setLastFeedback({ score: res.score, feedback: res.feedback, tips: res.tips });
                setAnswer("");
                queryClient.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetSkillBreakdownQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetWeeklyProgressQueryKey() });
            },
            onError: () => toast({ title: "Failed to submit answer", variant: "destructive" }),
        });
    };
    useEffect(() => {
        if (!currentQuestion || isCompleted || timerRunning || submitAnswer.isPending || autoStartCountdown === null || isReadingQuestion || questionRead)
            return;
        if (autoStartCountdown <= 0) {
            readQuestionThenStart();
            return;
        }
        const id = window.setTimeout(() => setAutoStartCountdown(prev => prev === null ? null : prev - 1), 1000);
        return () => window.clearTimeout(id);
    }, [currentQuestion?.id, isCompleted, timerRunning, submitAnswer.isPending, autoStartCountdown, isReadingQuestion, questionRead]);
    useEffect(() => {
        if (timerRemaining > 0 || submitAnswer.isPending || isCompleted || !currentQuestion || activeAnswerQuestionRef.current !== currentQuestion.id || submittedQuestionRef.current === currentQuestion.id)
            return;
        recognitionRef.current?.stop();
        shouldListenRef.current = false;
        setIsListening(false);
        setTimerRunning(false);
        const capturedAnswer = (liveTranscriptRef.current || answer).trim();
        if (capturedAnswer) {
            handleSubmit(capturedAnswer);
        }
        else {
            handleSubmit("");
        }
    }, [timerRemaining, submitAnswer.isPending, isCompleted, answer, currentQuestion]);
    if (interviews.isLoading)
        return (<AppLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48"/>
        <Skeleton className="h-64 rounded-xl"/>
      </div>
    </AppLayout>);
    if (!interview)
        return (<AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <MicOff className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3"/>
            <h2 className="text-lg font-semibold mb-2">Interview session unavailable</h2>
            <p className="text-sm text-muted-foreground mb-5">Incomplete sessions are removed when you leave. Only completed interviews stay in history.</p>
            <Link href="/interviews">
              <Button>Back to Interviews</Button>
            </Link>
          </CardContent>
        </Card>
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
            <p className="text-sm text-sky-100/70">{answeredCount} of {questions.length} questions answered · one sitting session</p>
          </div>
          {!isCompleted && (<Badge className={`border-sky-300/25 bg-white/10 text-white hover:bg-white/10 ${timerRemaining <= 15 ? "border-red-300/60 text-red-100" : ""}`}>{isReadingQuestion ? "Reading question" : autoStartCountdown !== null && !timerRunning && !questionRead ? `Starts in ${autoStartCountdown}s` : `Left ${formatTimer(timerRemaining)}`}</Badge>)}
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
                      <span className="text-2xl font-bold text-primary">Average {Math.round(interview.score)}%</span>
                    </div>)}
                  <p className="text-muted-foreground text-sm mb-6">{interview?.feedback}</p>
                  <div className="mx-auto mb-6 max-w-3xl space-y-3 text-left">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Session Report</h3>
                    {questions.map((question, index) => (<div key={question.id} className="rounded-lg border border-border bg-background p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">Q{index + 1}. {question.question}</p>
                        <Badge variant="outline">{Math.round(question.score ?? 0)}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{question.feedback}</p>
                      {(question.tips ?? []).length > 0 && (<div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {question.tips.map(tip => <p key={tip}>- {tip}</p>)}
                      </div>)}
                    </div>))}
                  </div>
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
                        <p className="text-sm font-medium text-white">Automatic voice answer</p>
                        <p className="text-xs text-sky-100/70">{voiceStatus || (isReadingQuestion ? "Reading question. Listen first, then answer." : autoStartCountdown !== null && !timerRunning && !questionRead ? "Interview starts automatically after the countdown." : isListening ? "Listening... your transcript appears below." : "30 seconds per question. It submits automatically when time ends.")}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button type="button" size="sm" variant={isListening ? "destructive" : "secondary"} onClick={isListening ? stopVoiceInput : startManualVoiceInput} disabled={submitAnswer.isPending || isReadingQuestion} className="gap-2">
                          {isListening ? <MicOff className="h-4 w-4"/> : <Mic className="h-4 w-4"/>}
                          {isListening ? "Stop" : "Start Mic"}
                        </Button>
                        <Badge className={`border-sky-300/25 bg-white/10 text-white hover:bg-white/10 ${timerRemaining <= 15 ? "border-red-300/60 text-red-100" : ""}`}>{isReadingQuestion ? "Reading" : autoStartCountdown !== null && !timerRunning && !questionRead ? `${autoStartCountdown}s` : formatTimer(timerRemaining)}</Badge>
                      </div>
                    </div>
                    <Textarea value={answer} onChange={e => { setAnswer(e.target.value); liveTranscriptRef.current = e.target.value; }} placeholder="Your transcript or typed answer appears here. Use STAR: Situation, Task, Action, Result." rows={6} data-testid="textarea-answer" className="resize-none border-sky-300/20 bg-black/30 text-white placeholder:text-sky-100/45"/>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-sky-100/65">
                      <span>{speechDebug || "Transcript will appear above when your voice is detected."}</span>
                      <span>{shouldListenRef.current || isListening ? "Mic active" : questionRead ? "Mic stopped" : "Waiting"}</span>
                    </div>
                    <div className="rounded-lg border border-sky-300/20 bg-black/20 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">Live answer feedback</p>
                        <Badge className="border-sky-300/25 bg-white/10 text-white hover:bg-white/10">{realtimeFeedback.score}%</Badge>
                      </div>
                      <p className="text-xs text-sky-100/75">{realtimeFeedback.nextTip}</p>
                      <p className="mt-1 text-xs text-sky-100/55">{realtimeFeedback.words} words · {realtimeFeedback.keywordHits} question keywords covered</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-sky-300/20 bg-black/20 px-3 py-2 text-sm text-sky-100/75">
                      {submitAnswer.isPending && <Loader2 className="h-4 w-4 animate-spin"/>}
                      {submitAnswer.isPending ? "Evaluating answer..." : "This question submits automatically when the timer ends."}
                    </div>
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
                        {q.answered && q.score !== undefined && (<Badge className="ml-auto border-sky-300/20 bg-white/10 text-white hover:bg-white/10">{Math.round(q.score)}%</Badge>)}
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
