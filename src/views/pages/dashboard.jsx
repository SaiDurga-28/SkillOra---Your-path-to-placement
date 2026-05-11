import { motion } from "framer-motion";
import { Link } from "wouter";
import { AlertTriangle, Briefcase, CheckCircle, Target, Mic, Trophy, Clock, ArrowRight, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useGetDashboardSummary, useGetWeeklyProgress, useGetSkillBreakdown, useGetUpcomingTasks, getGetDashboardSummaryQueryKey, getGetWeeklyProgressQueryKey, getGetSkillBreakdownQueryKey, getGetUpcomingTasksQueryKey } from "@/api";
import { useAuth } from "@/lib/auth-context";
const priorityColor = { high: "destructive", medium: "default", low: "secondary" };
const typeIcon = { skill: CheckCircle, interview: Mic, crt: Trophy, deadline: Clock };
export default function DashboardPage() {
    const { user } = useAuth();
    const summary = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
    const weekly = useGetWeeklyProgress({ query: { queryKey: getGetWeeklyProgressQueryKey() } });
    const breakdown = useGetSkillBreakdown({ query: { queryKey: getGetSkillBreakdownQueryKey() } });
    const tasks = useGetUpcomingTasks({ query: { queryKey: getGetUpcomingTasksQueryKey() } });
    const reminders = (tasks.data ?? []).filter(task => task.type === "deadline");
    const chartTextColor = "hsl(var(--foreground))";
    const hasStarted = (summary.data?.totalJobs ?? 0) > 0;
    const weeklyTotals = (weekly.data ?? []).reduce((totals, day) => ({
        skills: totals.skills + (day.skills ?? 0),
        assessments: totals.assessments + (day.assessments ?? 0),
        interviews: totals.interviews + (day.interviews ?? 0),
    }), { skills: 0, assessments: 0, interviews: 0 });
    const weeklyTotalProgress = weeklyTotals.skills + weeklyTotals.assessments + weeklyTotals.interviews;
    const weeklyReport = [
        { label: "Weekly Skills", value: weeklyTotals.skills, color: "bg-primary" },
        { label: "Weekly Tests", value: weeklyTotals.assessments, color: "bg-accent" },
        { label: "Weekly Interviews", value: weeklyTotals.interviews, color: "bg-emerald-500" },
    ];
    const stats = [
        { label: "Active Jobs", value: summary.data?.activeJobs ?? 0, icon: Briefcase, color: "text-primary" },
        { label: "Skills Completed", value: summary.data?.completedSkills ?? 0, icon: CheckCircle, color: "text-green-500" },
        { label: "Tests Done", value: summary.data?.testsCompleted ?? 0, icon: Trophy, color: "text-orange-500" },
        { label: "Interviews Done", value: summary.data?.interviewsCompleted ?? 0, icon: Mic, color: "text-accent" },
    ];
    return (<AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your placement preparation overview.</p>
        </motion.div>

        {/* Overall progress */}
        {summary.isLoading ? (<Skeleton className="h-24 w-full rounded-xl"/>) : !hasStarted ? (<Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold">Start by uploading a job description.</p>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Your dashboard will become dynamic after you create a roadmap. Skill progress, assessments, interviews, reminders, and weekly activity will appear here as you learn.</p>
              </div>
              <Link href="/upload">
                <Button className="gap-2">Upload JD <ArrowRight className="h-4 w-4"/></Button>
              </Link>
            </div>
          </CardContent>
        </Card>) : (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Overall Preparation Progress</p>
                    <p className="text-3xl font-bold text-primary" data-testid="text-completion-percentage">
                      {summary.data?.completionPercentage ?? 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.data?.completedSkills} of {summary.data?.totalSkills} skills completed · {summary.data?.completedJobs ?? 0} jobs complete
                    </p>
                  </div>
                  <div className="flex-1 max-w-sm">
                    <Progress value={summary.data?.completionPercentage ?? 0} className="h-3"/>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Started</span>
                      <span>{summary.data?.testsCompleted ?? 0} tests · {summary.data?.interviewsCompleted ?? 0} interviews</span>
                    </div>
                  </div>
                </div>
                {(summary.data?.testsCompleted ?? 0) > 0 && (<div className="mt-4 rounded-lg border border-primary/20 bg-background/70 px-3 py-2 text-sm">
                  <span className="font-medium text-primary">{summary.data?.averageTestScore ?? 0}%</span>
                  <span className="text-muted-foreground"> average test score across completed CRT/skills tests</span>
                </div>)}
              </CardContent>
            </Card>
          </motion.div>)}

        {/* Stat cards */}
        {hasStarted && <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (<motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="pt-6">
                  {summary.isLoading ? (<Skeleton className="h-12 w-full"/>) : (<div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${stat.color}`} data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                          {stat.value}
                        </p>
                      </div>
                      <stat.icon className={`w-5 h-5 ${stat.color}`}/>
                    </div>)}
                </CardContent>
              </Card>
            </motion.div>))}
        </div>}

        {hasStarted && reminders.length > 0 && (<Card className="border-red-500/40 bg-red-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-300">
              <AlertTriangle className="w-4 h-4"/> Deadline Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reminders.map(reminder => (<div key={reminder.id} className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-200">{reminder.title}</p>
                <p className="text-xs text-red-700/80 dark:text-red-200/80">Due {reminder.dueDate}</p>
              </div>
              <Badge variant="destructive">Urgent</Badge>
            </div>))}
          </CardContent>
        </Card>)}

        {/* Charts */}
        {hasStarted && <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary"/> Weekly Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weekly.isLoading ? <Skeleton className="h-40"/> : (<>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Weekly Progress Report</p>
                    <p className="text-xs text-muted-foreground">Last 7 days · {weeklyTotalProgress} total</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {weeklyReport.map(item => {
                      const percent = weeklyTotalProgress ? Math.round((item.value / weeklyTotalProgress) * 100) : 0;
                      return (<div key={item.label} className="rounded-md border border-border bg-background/60 px-3 py-2">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${item.color}`}/>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                        </div>
                        <div className="flex items-end justify-between gap-2">
                          <p className="text-lg font-semibold">{item.value}</p>
                          <p className="text-xs text-muted-foreground">{percent}%</p>
                        </div>
                      </div>);
                    })}
                  </div>
                </div>
                {weeklyTotalProgress === 0 ? (<div className="h-40 flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">No weekly progress yet</p>
                  <p>Complete a skill, test, or interview this week.</p>
                </div>) : (<ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weekly.data ?? []} barSize={8} barGap={2}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTextColor }}/>
                    <YAxis hide/>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: chartTextColor }} labelStyle={{ color: chartTextColor }} itemStyle={{ color: chartTextColor }}/>
                    <Bar dataKey="skills" fill="hsl(var(--primary))" radius={4} name="Skills"/>
                    <Bar dataKey="assessments" fill="hsl(var(--accent))" radius={4} name="Tests" opacity={0.7}/>
                    <Bar dataKey="interviews" fill="#10b981" radius={4} name="Interviews" opacity={0.7}/>
                  </BarChart>
                </ResponsiveContainer>)}
              </>)}
            </CardContent>
          </Card>

          {/* Skill breakdown pie chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary"/> Progress Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {breakdown.isLoading ? <Skeleton className="h-40"/> : (breakdown.data ?? []).length === 0 ? (<div className="h-40 flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Not started yet</p>
                <p>Complete skills, tests, or interviews to generate progress data.</p>
              </div>) : (<ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={breakdown.data ?? []} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                      {(breakdown.data ?? []).map((entry, index) => (<Cell key={index} fill={entry.color}/>))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: chartTextColor }} labelStyle={{ color: chartTextColor }} itemStyle={{ color: chartTextColor }}/>
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: chartTextColor }}/>
                  </PieChart>
                </ResponsiveContainer>)}
            </CardContent>
          </Card>
        </div>}

        {/* Upcoming tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary"/> Upcoming Tasks
            </CardTitle>
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all <ArrowRight className="w-3 h-3"/>
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {tasks.isLoading ? (<div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12"/>)}</div>) : (tasks.data ?? []).length === 0 ? (<div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No upcoming tasks. Upload a job description to get started.</p>
                <Link href="/upload">
                  <Button size="sm" className="mt-3">Upload JD</Button>
                </Link>
              </div>) : (<div className="space-y-3">
                {(tasks.data ?? []).map((task) => {
                const IconComp = typeIcon[task.type] ?? CheckCircle;
                return (<motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-colors" data-testid={`task-item-${task.id}`}>
                      <div className="flex items-center gap-3">
                        <IconComp className="w-4 h-4 text-primary shrink-0"/>
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.jobTitle} · Due {task.dueDate}</p>
                        </div>
                      </div>
                      <Badge variant={priorityColor[task.priority]} className="text-xs capitalize">
                        {task.priority}
                      </Badge>
                    </motion.div>);
            })}
              </div>)}
          </CardContent>
        </Card>
      </div>
    </AppLayout>);
}
