import { useState } from "react";
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
    const interviews = useListInterviews({ query: { queryKey: getListInterviewsQueryKey() } });
    const jobs = useListJobs({ query: { queryKey: getListJobsQueryKey() } });
    const createInterview = useCreateInterview();
    const startInterview = () => {
        if (!selectedJobId || !interviewType) {
            toast({ title: "Select a job and interview type", variant: "destructive" });
            return;
        }
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
              <Select onValueChange={setInterviewType} value={interviewType}>
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
                {createInterview.isPending ? "Starting..." : "Start"}
              </Button>
            </div>
            {(jobs.data ?? []).length === 0 && (<p className="text-xs text-muted-foreground mt-3">
                No jobs yet.{" "}
                <Link href="/upload" className="text-primary hover:underline">Upload a job description first.</Link>
              </p>)}
          </CardContent>
        </Card>

        {/* Past interviews */}
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Previous Sessions</h2>
          {interviews.isLoading ? (<div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl"/>)}</div>) : (interviews.data ?? []).length === 0 ? (<Card>
              <CardContent className="py-12 text-center">
                <Mic className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3"/>
                <p className="text-muted-foreground text-sm">No interviews yet. Start your first mock session above.</p>
              </CardContent>
            </Card>) : (<div className="space-y-3">
              {(interviews.data ?? []).map((interview, i) => {
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
                            <Badge variant={interview.status === "completed" ? "secondary" : "default"}>
                              {interview.status === "completed" ? "Completed" : "In Progress"}
                            </Badge>
                            {interview.status === "active" && (<Link href={`/interviews/${interview.id}`}>
                                <Button size="sm" variant="outline" data-testid={`button-continue-${interview.id}`}>Continue</Button>
                              </Link>)}
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
