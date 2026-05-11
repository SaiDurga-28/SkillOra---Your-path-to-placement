import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Mic, Plus, Star } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useListInterviews, useCreateInterview, useListJobs, getListInterviewsQueryKey, getListJobsQueryKey } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
export default function InterviewsPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedJobId, setSelectedJobId] = useState("");
    const [interviewType, setInterviewType] = useState("");
    const [autoStartCountdown, setAutoStartCountdown] = useState(null);
    const [autoStartArmed, setAutoStartArmed] = useState(false);
    const [micStatus, setMicStatus] = useState("");
    const interviews = useListInterviews({ query: { queryKey: getListInterviewsQueryKey() } });
    const jobs = useListJobs({ query: { queryKey: getListJobsQueryKey() } });
    const createInterview = useCreateInterview();
    const completedInterviews = (interviews.data ?? []).filter(interview => interview.status === "completed");
    const latestCompletedInterviews = completedInterviews.slice(0, 5);
    const warmUpSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setMicStatus("Microphone ready, but speech-to-text needs Chrome or Edge.");
            return;
        }
        try {
            const recognition = new SpeechRecognition();
            recognition.lang = "en-US";
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.onstart = () => {
                setMicStatus("Voice engine ready. The interview will listen automatically.");
                window.setTimeout(() => recognition.stop(), 700);
            };
            recognition.onerror = () => {
                setMicStatus("Microphone ready. If words do not appear, use Chrome/Edge and check browser voice permissions.");
            };
            recognition.start();
        }
        catch {
            setMicStatus("Microphone ready. The interview will listen automatically.");
        }
    };
    const prepareMicrophone = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setMicStatus("Voice capture works best in Chrome or Edge on localhost/HTTPS.");
            return false;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setMicStatus("Microphone ready. The interview will listen automatically.");
            warmUpSpeechRecognition();
            return true;
        }
        catch {
            setMicStatus("Microphone permission is blocked. Allow it in the browser, or type answers during the timer.");
            return false;
        }
    };
    const handleInterviewTypeChange = (value) => {
        setInterviewType(value);
        prepareMicrophone();
    };
    const startInterview = async () => {
        if (!selectedJobId || !interviewType) {
            toast({ title: "Select a job and interview type", variant: "destructive" });
            return;
        }
        await prepareMicrophone();
        setAutoStartCountdown(null);
        setAutoStartArmed(false);
        createInterview.mutate({
            data: { jobId: parseInt(selectedJobId), type: interviewType },
        }, {
            onSuccess: (interview) => {
                queryClient.invalidateQueries({ queryKey: getListInterviewsQueryKey() });
                setLocation(`/interviews/${interview.id}`);
            },
            onError: () => toast({ title: "Failed to start interview", variant: "destructive" }),
        });
    };
    useEffect(() => {
        if (!selectedJobId || !interviewType || createInterview.isPending) {
            setAutoStartCountdown(null);
            setAutoStartArmed(false);
            return;
        }
        setAutoStartCountdown(5);
        setAutoStartArmed(true);
    }, [selectedJobId, interviewType, createInterview.isPending]);
    useEffect(() => {
        if (!autoStartArmed || autoStartCountdown === null)
            return;
        if (autoStartCountdown <= 0) {
            startInterview();
            return;
        }
        const id = window.setTimeout(() => setAutoStartCountdown(prev => prev === null ? null : prev - 1), 1000);
        return () => window.clearTimeout(id);
    }, [autoStartArmed, autoStartCountdown]);
    const typeConfig = {
        hr: { label: "HR Interview", color: "bg-blue-500/10 text-blue-500" },
        technical: { label: "Technical", color: "bg-sky-500/10 text-sky-600 dark:text-sky-300" },
        mixed: { label: "Mixed", color: "bg-orange-500/10 text-orange-500" },
    };
    return (<AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Mock Interviews</h1>
          <p className="text-muted-foreground text-sm mt-1">Practice HR and technical interviews with instant AI feedback.</p>
        </motion.div>

        {/* Start new interview */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary"/> Start New Interview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select onValueChange={setSelectedJobId} value={selectedJobId}>
                <SelectTrigger className="flex-1" data-testid="select-job">
                  <SelectValue placeholder="Select a job"/>
                </SelectTrigger>
                <SelectContent>
                  {(jobs.data ?? []).map(j => (<SelectItem key={j.id} value={String(j.id)}>{j.title}{j.company ? ` · ${j.company}` : ""}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select onValueChange={handleInterviewTypeChange} value={interviewType}>
                <SelectTrigger className="w-full sm:w-44" data-testid="select-type">
                  <SelectValue placeholder="Interview type"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hr">HR Interview</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={startInterview} disabled={createInterview.isPending} className="gap-2 shrink-0" data-testid="button-start-interview">
                <Mic className="w-4 h-4"/>
                {createInterview.isPending ? "Starting..." : autoStartCountdown !== null ? `Starts in ${autoStartCountdown}s` : "Start"}
              </Button>
            </div>
            {(jobs.data ?? []).length === 0 && (<p className="text-xs text-muted-foreground mt-3">
                No jobs yet.{" "}
                <Link href="/upload" className="text-primary hover:underline">Upload a job description first.</Link>
              </p>)}
            {micStatus && <p className="text-xs text-muted-foreground mt-3">{micStatus}</p>}
          </CardContent>
        </Card>

        {/* Past interviews */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Latest 5 Completed Sessions</h2>
          {interviews.isLoading ? (<div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl"/>)}</div>) : completedInterviews.length === 0 ? (<Card>
              <CardContent className="py-12 text-center">
                <Mic className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3"/>
                <p className="text-muted-foreground text-sm">No completed interviews yet. Start one above and finish it in one sitting.</p>
              </CardContent>
            </Card>) : (<div className="space-y-3">
              {latestCompletedInterviews.map((interview, i) => {
                const tc = typeConfig[interview.type];
                return (<motion.div key={interview.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="hover:border-primary/30 transition-colors" data-testid={`interview-card-${interview.id}`}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`px-2 py-1 rounded-md text-xs font-medium ${tc?.color}`}>
                              {tc?.label ?? interview.type}
                            </div>
                            <div>
                              <p className="text-sm font-medium">Session #{interview.id}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(interview.createdAt).toLocaleDateString()} · {interview.questions.length} questions
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {interview.score !== null && interview.score !== undefined && (<div className="flex items-center gap-1 text-sm font-semibold text-primary">
                                <Star className="w-3.5 h-3.5"/> {Math.round(interview.score)}%
                              </div>)}
                            <Badge variant="secondary">Completed</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>);
            })}
            </div>)}
        </div>
      </div>
    </AppLayout>);
}
