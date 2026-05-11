import { motion } from "framer-motion";
import { useParams, Link } from "wouter";
import { CheckCircle, Circle, ExternalLink, ArrowLeft, AlertCircle, BookOpen, Code, Brain, MessageSquare, Mic } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useGetRoadmap, useUpdateProgress, getGetRoadmapQueryKey, getListJobsQueryKey, getListProgressQueryKey, getGetDashboardSummaryQueryKey, getGetSkillBreakdownQueryKey, getGetWeeklyProgressQueryKey, getGetUpcomingTasksQueryKey } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
const categoryIcon = {
    technical: Code,
    dsa: Brain,
    crt: BookOpen,
    communication: MessageSquare,
    interview: Mic,
};
const priorityVariant = { high: "destructive", medium: "default", low: "secondary" };
function normalizeResource(resource) {
    if (typeof resource === "string") {
        return {
            title: resource,
            url: "https://www.freecodecamp.org/learn/",
        };
    }
    return resource;
}
export default function RoadmapPage() {
    const { jobId } = useParams();
    const id = parseInt(jobId, 10);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const roadmap = useGetRoadmap(id, { query: { enabled: !!id, queryKey: getGetRoadmapQueryKey(id) } });
    const updateProgress = useUpdateProgress();
    const toggleSkill = (roadmapId, skillId, currentCompleted) => {
        updateProgress.mutate({
            roadmapId,
            skillId,
            data: { completed: !currentCompleted },
        }, {
            onSuccess: (updatedRoadmap) => {
                queryClient.setQueryData(getGetRoadmapQueryKey(id), updatedRoadmap);
                queryClient.invalidateQueries({ queryKey: getGetRoadmapQueryKey(id) });
                queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
                queryClient.invalidateQueries({ queryKey: getListProgressQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetSkillBreakdownQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetWeeklyProgressQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetUpcomingTasksQueryKey() });
                toast({
                    title: !currentCompleted ? "Skill completed!" : "Skill unmarked",
                    description: !currentCompleted ? "Great progress! Keep it up." : "Skill marked as incomplete.",
                });
            },
            onError: (error) => {
                toast({ title: "Could not update skill", description: error.message ?? "Please try again.", variant: "destructive" });
            },
        });
    };
    return (<AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link href="/jobs">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4"/>
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Learning Roadmap</h1>
            <p className="text-muted-foreground text-sm mt-1">Your personalized preparation plan — check off skills as you complete them.</p>
          </div>
        </motion.div>

        {roadmap.isLoading ? (<div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl"/>)}</div>) : !roadmap.data ? (<Card>
            <CardContent className="pt-6 text-center py-16">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3"/>
              <p className="text-muted-foreground">Roadmap not found. Upload a job description first.</p>
              <Link href="/upload"><Button className="mt-4">Upload JD</Button></Link>
            </CardContent>
          </Card>) : (<>
            {/* Summary */}
            <Card className="border-primary/20">
              <CardContent className="pt-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Progress</p>
                    <p className="text-3xl font-bold text-primary" data-testid="text-roadmap-progress">{roadmap.data.completionPercentage}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{roadmap.data.totalDays}-day preparation plan</p>
                  </div>
                  <div className="flex-1 max-w-xs">
                    <Progress value={roadmap.data.completionPercentage} className="h-2"/>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phases */}
            <div className="space-y-5">
              {roadmap.data.phases.map((phase, phaseIdx) => {
                const IconComp = categoryIcon[phase.category] ?? BookOpen;
                const completedCount = phase.skills.filter(s => s.completed).length;
                const phaseProgress = phase.skills.length > 0 ? Math.round((completedCount / phase.skills.length) * 100) : 0;
                return (<motion.div key={phase.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: phaseIdx * 0.1 }}>
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${phase.color}20` }}>
                              <IconComp className="w-5 h-5" style={{ color: phase.color }}/>
                            </div>
                            <div>
                              <CardTitle className="text-sm">{phase.title}</CardTitle>
                              <p className="text-xs text-muted-foreground">Days {phase.startDay}–{phase.endDay}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold" style={{ color: phase.color }}>{completedCount}/{phase.skills.length}</p>
                            <p className="text-xs text-muted-foreground">{phaseProgress}%</p>
                          </div>
                        </div>
                        <Progress value={phaseProgress} className="h-1 mt-2"/>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {phase.skills.map((skill) => (<motion.div key={skill.id} layout className={`p-4 rounded-lg border transition-all ${skill.completed ? "border-green-500/30 bg-green-500/5" : "border-border hover:border-primary/30"}`} data-testid={`skill-item-${skill.id}`}>
                            <div className="flex items-start gap-3">
                              <button onClick={() => toggleSkill(roadmap.data.id, skill.id, skill.completed)} disabled={updateProgress.isPending} className="mt-0.5 shrink-0 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60" data-testid={`checkbox-skill-${skill.id}`}>
                                {skill.completed ? (<CheckCircle className="w-5 h-5 text-green-500"/>) : (<Circle className="w-5 h-5 text-muted-foreground"/>)}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className={`text-sm font-medium ${skill.completed ? "line-through text-muted-foreground" : ""}`}>{skill.name}</p>
                                  <Badge variant={priorityVariant[skill.priority]} className="text-xs capitalize">{skill.priority}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{skill.description}</p>
                                <div className="flex flex-wrap gap-2">
                                  {skill.resources.map((resource, ri) => {
                const r = normalizeResource(resource);
                return (<a key={ri} href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline" data-testid={`resource-link-${skill.id}-${ri}`}>
                                      <ExternalLink className="w-3 h-3"/> {r.title}
                                    </a>);
            })}
                                </div>
                              </div>
                            </div>
                          </motion.div>))}
                      </CardContent>
                    </Card>
                  </motion.div>);
            })}
            </div>
          </>)}
      </div>
    </AppLayout>);
}
