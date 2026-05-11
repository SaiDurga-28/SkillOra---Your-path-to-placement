import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, Plus, Calendar, ChevronRight, AlertCircle, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
    useDeleteJob,
    useListJobs,
    getGetDashboardSummaryQueryKey,
    getGetSkillBreakdownQueryKey,
    getGetUpcomingTasksQueryKey,
    getGetWeeklyProgressQueryKey,
    getGetRoadmapQueryKey,
    getListInterviewsQueryKey,
    getListJobsQueryKey,
} from "@/api";
const statusConfig = {
    pending: { label: "Pending", variant: "secondary" },
    analyzed: { label: "Start", variant: "secondary" },
    in_progress: { label: "In Progress", variant: "default" },
    completed: { label: "Completed", variant: "secondary" },
};
const difficultyColor = {
    beginner: "text-green-500",
    intermediate: "text-yellow-500",
    advanced: "text-red-500",
};
export default function JobsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const jobs = useListJobs({ query: { queryKey: getListJobsQueryKey() } });
    const deleteJob = useDeleteJob();
    const refreshProgressQueries = () => {
        [
            getListJobsQueryKey(),
            getGetDashboardSummaryQueryKey(),
            getGetSkillBreakdownQueryKey(),
            getGetUpcomingTasksQueryKey(),
            getGetWeeklyProgressQueryKey(),
            getListInterviewsQueryKey(),
        ].forEach(queryKey => queryClient.invalidateQueries({ queryKey }));
    };
    const handleDeleteJob = (job) => {
        if (!window.confirm(`Delete "${job.title}" and its interview history?`))
            return;
        deleteJob.mutate({ jobId: job.id }, {
            onSuccess: () => {
                queryClient.setQueryData(getListJobsQueryKey(), (current = []) => current.filter(item => String(item.id) !== String(job.id)));
                queryClient.removeQueries({ queryKey: getGetRoadmapQueryKey(job.id) });
                refreshProgressQueries();
                toast({ title: "Job deleted", description: "Your dashboard has been updated." });
            },
            onError: () => toast({ title: "Failed to delete job", variant: "destructive" }),
        });
    };
    return (<AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Jobs</h1>
            <p className="text-muted-foreground text-sm mt-1">All uploaded job descriptions and their preparation status.</p>
          </div>
          <Link href="/upload">
            <Button size="sm" className="gap-2" data-testid="button-add-job">
              <Plus className="w-4 h-4"/> Upload JD
            </Button>
          </Link>
        </motion.div>

        {jobs.isLoading ? (<div className="space-y-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl"/>)}
          </div>) : jobs.isError ? (<Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3"/>
              <p className="text-muted-foreground">Failed to load jobs. Please try again.</p>
            </CardContent>
          </Card>) : (jobs.data ?? []).length === 0 ? (<Card>
            <CardContent className="pt-6 text-center py-16">
              <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4"/>
              <h3 className="font-semibold mb-2">No jobs uploaded yet</h3>
              <p className="text-muted-foreground text-sm mb-6">Upload your first job description to generate a personalized preparation roadmap.</p>
              <Link href="/upload">
                <Button className="gap-2" data-testid="button-upload-first">
                  <Plus className="w-4 h-4"/> Upload Job Description
                </Button>
              </Link>
            </CardContent>
          </Card>) : (<div className="space-y-4">
            {(jobs.data ?? []).map((job, i) => {
                const status = statusConfig[job.status] ?? statusConfig.pending;
                const diffClass = difficultyColor[job.difficulty] ?? "text-muted-foreground";
                return (<motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="hover:border-primary/30 transition-colors" data-testid={`job-card-${job.id}`}>
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate" data-testid={`job-title-${job.id}`}>{job.title}</h3>
                            {job.company && <span className="text-xs text-muted-foreground">· {job.company}</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3"/> {job.deadline}
                            </div>
                            <span className={`font-medium capitalize ${diffClass}`}>{job.difficulty}</span>
                            <span>{job.estimatedDays} days plan</span>
                            <span>{job.extractedSkills.length} skills</span>
                            <span>{job.completedSkills ?? 0} completed</span>
                            {job.status === "analyzed" && <span>Preparation not started</span>}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.extractedSkills.slice(0, 5).map(s => (<Badge key={s} variant="outline" className="text-xs py-0">{s}</Badge>))}
                            {job.extractedSkills.length > 5 && (<Badge variant="outline" className="text-xs py-0">+{job.extractedSkills.length - 5} more</Badge>)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteJob(job)} disabled={deleteJob.isPending} data-testid={`button-delete-job-${job.id}`}>
                            <Trash2 className="w-4 h-4"/>
                          </Button>
                          <Link href={`/roadmap/${job.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-view-roadmap-${job.id}`}>
                              <ChevronRight className="w-4 h-4"/>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>);
            })}
          </div>)}
      </div>
    </AppLayout>);
}
