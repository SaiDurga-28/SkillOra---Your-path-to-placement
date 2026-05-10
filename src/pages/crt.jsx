import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Trophy, CheckCircle, XCircle, RotateCcw, Loader2, Shuffle, Brain, Mic, MicOff, Presentation, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useListCrtQuestions, useSubmitCrtAnswers, getListCrtQuestionsQueryKey } from "@/api";
const jamTopics = {
    easy: ["My favorite app and why it works well", "The importance of punctuality", "How students can use AI responsibly", "A skill I want to master"],
    medium: ["Remote work versus office work", "Social media and attention span", "How to handle failure in interviews", "The future of online education"],
    hard: ["Ethics of artificial intelligence in hiring", "Should college marks matter in placements?", "Balancing innovation and privacy", "Leadership during uncertainty"],
};
function communicationPrompt(mode, difficulty, round, fileName = "") {
    if (mode === "presentation") {
        return fileName
            ? `Present the main idea, structure, and conclusion of "${fileName}" as if you are explaining it to an interview panel.`
            : "Upload a PPT/PDF or notes file, then present its key message, flow, and conclusion.";
    }
    const list = jamTopics[difficulty] ?? jamTopics.easy;
    return list[round % list.length];
}
function evaluateSpeech(text, difficulty) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const unique = new Set(words.map(word => word.toLowerCase().replace(/[^a-z]/g, "")).filter(Boolean));
    const hasStructure = /first|second|finally|because|example|conclusion|therefore|however/i.test(text);
    const target = difficulty === "hard" ? 120 : difficulty === "medium" ? 90 : 60;
    const lengthScore = Math.min(35, Math.round((words.length / target) * 35));
    const clarityScore = Math.min(30, Math.round((unique.size / Math.max(words.length, 1)) * 45));
    const structureScore = hasStructure ? 25 : 10;
    const score = Math.min(100, lengthScore + clarityScore + structureScore + 10);
    return {
        score,
        feedback: score >= 75
            ? "Strong communication practice. You gave enough detail, structure, and clarity."
            : "Good start. Add a clearer opening, one example, and a concise conclusion.",
        tips: [
            "Start with a one-line position.",
            "Use two or three organized points.",
            "Close with a short summary instead of stopping suddenly.",
        ],
    };
}
export default function CrtPage() {
    const { toast } = useToast();
    const [activeAssessment, setActiveAssessment] = useState("crt");
    const [activeCategory, setActiveCategory] = useState("aptitude");
    const [activeDifficulty, setActiveDifficulty] = useState("easy");
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [communicationResult, setCommunicationResult] = useState(null);
    const [quizStarted, setQuizStarted] = useState(false);
    const [testRound, setTestRound] = useState(0);
    const [communicationMode, setCommunicationMode] = useState("jam");
    const [speechText, setSpeechText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [presentationFile, setPresentationFile] = useState("");
    const [presentationFileInfo, setPresentationFileInfo] = useState(null);
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerRemaining, setTimerRemaining] = useState(60);
    const recognitionRef = useRef(null);
    const questionParams = { category: activeAssessment === "skills" ? "learned" : activeCategory, difficulty: activeDifficulty, round: testRound };
    const questions = useListCrtQuestions(questionParams, { query: { queryKey: getListCrtQuestionsQueryKey(questionParams) } });
    const submitQuiz = useSubmitCrtAnswers();
    const commPrompt = useMemo(() => communicationPrompt(communicationMode, activeDifficulty, testRound, presentationFile), [communicationMode, activeDifficulty, testRound, presentationFile]);
    const timerSeconds = activeDifficulty === "hard" ? 180 : activeDifficulty === "medium" ? 120 : 60;
    useEffect(() => {
        setTimerRemaining(timerSeconds);
        setTimerRunning(false);
    }, [timerSeconds, commPrompt]);
    useEffect(() => {
        if (!timerRunning || timerRemaining <= 0) return;
        const id = window.setInterval(() => setTimerRemaining(prev => Math.max(0, prev - 1)), 1000);
        return () => window.clearInterval(id);
    }, [timerRunning, timerRemaining]);
    const handleAnswer = (questionId, optionIndex) => {
        if (result)
            return;
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };
    const handleSubmit = () => {
        const qs = questions.data ?? [];
        const questionIds = qs.map(q => q.id);
        const ans = questionIds.map(id => answers[id] ?? -1);
        const correctOptions = qs.map(q => q.correctOption);
        submitQuiz.mutate({ data: { questionIds, answers: ans, correctOptions } }, {
            onSuccess: (res) => {
                setResult(res);
                toast({ title: `Quiz complete! Score: ${res.percentage}%` });
            },
            onError: () => toast({ title: "Submission failed", variant: "destructive" }),
        });
    };
    const handleRetrySameTest = () => {
        setAnswers({});
        setResult(null);
        setCommunicationResult(null);
        setQuizStarted(false);
        setSpeechText("");
    };
    const handleOtherTest = () => {
        setAnswers({});
        setResult(null);
        setCommunicationResult(null);
        setQuizStarted(false);
        setSpeechText("");
        setTestRound(prev => prev + 1);
    };
    const speechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    const startSpeech = () => {
        if (!speechRecognition) {
            toast({ title: "Voice input is not supported in this browser", variant: "destructive" });
            return;
        }
        const recognition = new speechRecognition();
        recognition.lang = "en-IN";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results).map(result => result[0]?.transcript ?? "").join(" ").trim();
            setSpeechText(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => {
            setIsListening(false);
            toast({ title: "Voice capture stopped", variant: "destructive" });
        };
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    };
    const stopSpeech = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };
    const evaluateCommunication = () => {
        const res = evaluateSpeech(speechText, activeDifficulty);
        setCommunicationResult(res);
        toast({ title: `Communication score: ${res.score}%` });
    };
    const uploadPresentationFile = (file) => {
        if (!file) return;
        setPresentationFile(file.name);
        setPresentationFileInfo({
            name: file.name,
            type: file.type || "Unknown file",
            size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        });
        setSpeechText("");
        setCommunicationResult(null);
        toast({ title: "Presentation file uploaded", description: file.name });
    };
    const qs = questions.data ?? [];
    const answeredCount = Object.keys(answers).length;
    const progress = qs.length > 0 ? Math.round((answeredCount / qs.length) * 100) : 0;
    return (<AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Assessments</h1>
          <p className="text-muted-foreground text-sm mt-1">Take CRT practice tests or a learned-skills test generated from your roadmap.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeAssessment === "communication" ? (<motion.div key="communication" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-4">
                <Tabs value={activeAssessment} onValueChange={v => { setActiveAssessment(v); setAnswers({}); setResult(null); setCommunicationResult(null); setQuizStarted(false); setTestRound(prev => prev + 1); }}>
                  <TabsList>
                    <TabsTrigger value="crt">CRT</TabsTrigger>
                    <TabsTrigger value="skills">Learned Skills Test</TabsTrigger>
                    <TabsTrigger value="communication">Communication</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Tabs value={communicationMode} onValueChange={v => { setCommunicationMode(v); setSpeechText(""); setCommunicationResult(null); setTestRound(prev => prev + 1); }}>
                    <TabsList>
                      <TabsTrigger value="jam">JAM</TabsTrigger>
                      <TabsTrigger value="presentation">Presentation</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="flex gap-2">
                    {["easy", "medium", "hard"].map(d => (<Button key={d} size="sm" variant={activeDifficulty === d ? "default" : "outline"} onClick={() => { setActiveDifficulty(d); setSpeechText(""); setCommunicationResult(null); setTestRound(prev => prev + 1); }} className="capitalize">
                      {d}
                    </Button>))}
                  </div>
                </div>
                {communicationMode === "presentation" && (<div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                  <Input type="file" accept="*/*" onChange={(event) => uploadPresentationFile(event.target.files?.[0])} />
                  {presentationFileInfo && (<div className="mt-3 rounded-lg border border-border bg-background p-3 text-sm">
                    <p className="font-medium">{presentationFileInfo.name}</p>
                    <p className="text-xs text-muted-foreground">{presentationFileInfo.type} - {presentationFileInfo.size}</p>
                  </div>)}
                </div>)}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {communicationMode === "presentation" ? <Presentation className="h-5 w-5 text-primary"/> : <Mic className="h-5 w-5 text-primary"/>}
                      {communicationMode === "presentation" ? "Presentation Practice" : "Just A Minute Practice"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4"/> Timer: {Math.floor(timerRemaining / 60)}:{String(timerRemaining % 60).padStart(2, "0")}
                        </span>
                        <span className={timerRemaining === 0 ? "font-semibold text-destructive" : ""}>{timerRemaining === 0 ? "Time up" : `${activeDifficulty} level`}</span>
                      </div>
                      <p className="font-medium">{commPrompt}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={isListening ? stopSpeech : startSpeech} variant={isListening ? "destructive" : "outline"} className="gap-2">
                        {isListening ? <MicOff className="h-4 w-4"/> : <Mic className="h-4 w-4"/>}
                        {isListening ? "Stop" : "Speak"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setTimerRunning(prev => !prev)}>
                        {timerRunning ? "Pause Timer" : "Start Timer"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => { setTimerRemaining(timerSeconds); setTimerRunning(false); }}>
                        Reset
                      </Button>
                      {communicationMode === "jam" && (<Button type="button" variant="outline" onClick={handleOtherTest} className="gap-2">
                        <Shuffle className="h-4 w-4"/> Other Question
                      </Button>)}
                    </div>
                    <textarea value={speechText} onChange={event => setSpeechText(event.target.value)} rows={7} className="w-full resize-none rounded-md border border-input bg-transparent p-3 text-sm outline-none focus:ring-1 focus:ring-ring" placeholder="Speak or type your answer here..." />
                    <Button onClick={evaluateCommunication} disabled={!speechText.trim()} className="w-full">Evaluate Communication</Button>
                    {communicationResult && (<div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <p className="text-lg font-bold text-primary">{communicationResult.score}%</p>
                      <p className="mt-1 text-sm text-muted-foreground">{communicationResult.feedback}</p>
                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        {communicationResult.tips.map(tip => <p key={tip}>- {tip}</p>)}
                      </div>
                    </div>)}
                  </CardContent>
                </Card>
              </div>
            </motion.div>) : result ? (<motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className={`border-2 ${result.percentage >= 70 ? "border-green-500/40 bg-green-500/5" : "border-orange-500/40 bg-orange-500/5"}`}>
                <CardContent className="py-10 text-center">
                  <Trophy className={`w-12 h-12 mx-auto mb-4 ${result.percentage >= 70 ? "text-green-500" : "text-orange-500"}`}/>
                  <h2 className="text-2xl font-bold mb-1">{result.percentage}%</h2>
                  <p className="text-muted-foreground text-sm mb-4">{result.score} of {result.total} correct</p>
                  <div className="flex justify-center gap-6 mb-6">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4"/> {result.correct.length} correct
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-500">
                      <XCircle className="w-4 h-4"/> {result.incorrect.length} incorrect
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button onClick={handleRetrySameTest} className="gap-2" data-testid="button-retry">
                      <RotateCcw className="w-4 h-4"/> Try Same Test
                    </Button>
                    <Button onClick={handleOtherTest} variant="outline" className="gap-2" data-testid="button-other-test">
                      <Shuffle className="w-4 h-4"/> Take Other Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>) : (<motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Category & Difficulty selector */}
              <div className="flex flex-col gap-4 mb-4">
                <Tabs value={activeAssessment} onValueChange={v => { setActiveAssessment(v); setAnswers({}); setResult(null); setCommunicationResult(null); setQuizStarted(false); setTestRound(prev => prev + 1); }}>
                  <TabsList>
                    <TabsTrigger value="crt">CRT</TabsTrigger>
                    <TabsTrigger value="skills">Learned Skills Test</TabsTrigger>
                    <TabsTrigger value="communication">Communication</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {activeAssessment === "crt" && (<Tabs value={activeCategory} onValueChange={v => { setActiveCategory(v); setAnswers({}); setResult(null); setQuizStarted(false); setTestRound(prev => prev + 1); }}>
                    <TabsList>
                      <TabsTrigger value="aptitude">Aptitude</TabsTrigger>
                      <TabsTrigger value="logical">Logical</TabsTrigger>
                      <TabsTrigger value="verbal">Verbal</TabsTrigger>
                    </TabsList>
                  </Tabs>)}
                  <div className="flex gap-2">
                    {["easy", "medium", "hard"].map(d => (<Button key={d} size="sm" variant={activeDifficulty === d ? "default" : "outline"} onClick={() => { setActiveDifficulty(d); setAnswers({}); setResult(null); setQuizStarted(false); setTestRound(prev => prev + 1); }} className="capitalize" data-testid={`button-difficulty-${d}`}>
                        {d}
                      </Button>))}
                  </div>
                </div>
              </div>

              {/* Progress */}
              {quizStarted && qs.length > 0 && (<div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{answeredCount} of {qs.length} answered</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2"/>
                </div>)}

              {/* Questions */}
              {questions.isLoading ? (<div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl"/>)}</div>) : qs.length === 0 ? (<Card>
                  <CardContent className="py-12 text-center">
                    {activeAssessment === "skills" ? <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3"/> : <BookOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3"/>}
                    <p className="text-muted-foreground text-sm">{activeAssessment === "skills" ? "Upload a job description and complete roadmap skills to generate a learned-skills test." : "No questions available for this selection."}</p>
                  </CardContent>
                </Card>) : (<div className="space-y-4">
                  {qs.map((q, qi) => {
                    const opts = q.options;
                    const selected = answers[q.id];
                    return (<motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.05 }}>
                        <Card data-testid={`question-card-${q.id}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-sm font-medium leading-relaxed flex-1">{q.question}</CardTitle>
                              <Badge variant="outline" className="capitalize text-xs shrink-0">{q.difficulty}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 gap-2">
                              {opts.map((opt, oi) => (<button key={oi} onClick={() => { handleAnswer(q.id, oi); setQuizStarted(true); }} disabled={!!result} className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${selected === oi
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"}`} data-testid={`option-${q.id}-${oi}`}>
                                  <span className="font-mono mr-2 text-xs text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                                  {opt}
                                </button>))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>);
                })}

                  <Button onClick={handleSubmit} disabled={answeredCount === 0 || submitQuiz.isPending} className="w-full gap-2" data-testid="button-submit-quiz">
                    {submitQuiz.isPending ? (<><Loader2 className="w-4 h-4 animate-spin"/> Submitting...</>) : (`Submit Quiz (${answeredCount}/${qs.length} answered)`)}
                  </Button>
                </div>)}
            </motion.div>)}
        </AnimatePresence>
      </div>
    </AppLayout>);
}
