import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { Calendar, Map, AlertCircle, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetJob, getGetJobQueryKey } from "@/api";
export default function JobDetailPage() {
    const { jobId } = useParams();
    const id = parseInt(jobId, 10);
    const job = useGetJob(id, { query: { enabled: !!id, queryKey: getGetJobQueryKey(id) } });
    if (job.isLoading)
        return (<AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48"/>
        <Skeleton className="h-48 w-full rounded-xl"/>
      </div>
    </AppLayout>);
    if (!job.data)
        return (<AppLayout>
      <div className="p-6 max-w-3xl mx-auto text-center py-20">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3"/>
        <p className="text-muted-foreground">Job not found.</p>
        <Link href="/jobs"><Button variant="outline" className="mt-4">Back to Jobs</Button></Link>
      </div>
    </AppLayout>);
    const j = job.data;
    const difficultyColor = { beginner: "text-green-500", intermediate: "text-yellow-500", advanced: "text-red-500" };
    return (<AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link href="/jobs">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4"/>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{j.title}</h1>
            {j.company && <p className="text-muted-foreground text-sm">{j.company}</p>}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-primary">{j.estimatedDays}</p>
              <p className="text-xs text-muted-foreground">Prep Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className={`text-2xl font-bold capitalize ${difficultyColor[j.difficulty]}`}>{j.difficulty}</p>
              <p className="text-xs text-muted-foreground">Difficulty</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground"/>
              <div>
                <p className="text-sm font-semibold">{j.deadline}</p>
                <p className="text-xs text-muted-foreground">Deadline</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Extracted Skills ({j.extractedSkills.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {j.extractedSkills.map(skill => (<Badge key={skill} variant="secondary" className="capitalize" data-testid={`skill-${skill}`}>{skill}</Badge>))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-10">{j.description}</p>
          </CardContent>
        </Card>

        <Link href={`/roadmap/${j.id}`}>
          <Button className="w-full gap-2" data-testid="button-view-roadmap">
            <Map className="w-4 h-4"/> View Learning Roadmap
          </Button>
        </Link>
      </div>
    </AppLayout>);
}
