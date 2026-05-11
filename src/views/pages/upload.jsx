import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Upload, CheckCircle, Loader2, Sparkles, FileText, Keyboard } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
    useCreateJob,
    getGetDashboardSummaryQueryKey,
    getGetSkillBreakdownQueryKey,
    getGetUpcomingTasksQueryKey,
    getGetWeeklyProgressQueryKey,
    getListJobsQueryKey,
} from "@/api";
import { useQueryClient } from "@tanstack/react-query";
const schema = z.object({
    title: z.string().min(2, "Job title is required"),
    company: z.string().optional(),
    description: z.string()
        .min(120, "Please paste a real job description with responsibilities and requirements.")
        .refine((value) => {
        const text = value.toLowerCase();
        const signals = ["responsibilities", "requirements", "skills", "experience", "qualification", "role", "candidate", "developer", "engineer", "analyst", "work"];
        return signals.filter((signal) => text.includes(signal)).length >= 3;
    }, "This does not look like a valid job description. Add role details, responsibilities, required skills, and qualifications."),
    deadline: z.string().min(1, "Preparation deadline is required"),
});
export default function UploadPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const createJob = useCreateJob();
    const [dragOver, setDragOver] = useState(false);
    const [result, setResult] = useState(null);
    const [inputMode, setInputMode] = useState("type");
    const [fileName, setFileName] = useState("");
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { title: "", company: "", description: "", deadline: "" },
    });
    const descriptionFromFile = (file, text = "") => {
        const title = form.getValues("title") || "Uploaded job role";
        const company = form.getValues("company") || "the selected company";
        const readableText = text.trim();
        if (readableText.length > 80) {
            return readableText;
        }
        return `${title} at ${company}. Job description uploaded from ${file.name}. The role requires a candidate with relevant job-specific abilities, experience, responsibilities, qualifications, and work readiness. Review this uploaded file and type the exact technologies or required skills from the JD here before analysis.`;
    };
    const loadDescriptionFile = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            form.setValue("description", descriptionFromFile(file, String(ev.target?.result ?? "")), { shouldValidate: true, shouldDirty: true });
            setFileName(file.name);
            setInputMode("file");
        };
        reader.onerror = () => {
            form.setValue("description", descriptionFromFile(file), { shouldValidate: true, shouldDirty: true });
            setFileName(file.name);
            setInputMode("file");
            toast({ title: "File attached", description: "This file could not be read as text, so a draft description was created. Add details if needed." });
        };
        if (file.type.startsWith("image/")) {
            form.setValue("description", descriptionFromFile(file), { shouldValidate: true, shouldDirty: true });
            setFileName(file.name);
            setInputMode("file");
            toast({ title: "Photo attached", description: "Image OCR needs a backend service, so a draft description was created from the upload." });
            return;
        }
        reader.readAsText(file);
    };
    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        loadDescriptionFile(e.dataTransfer.files[0]);
    };
    const onSubmit = (data) => {
        createJob.mutate({
            data: {
                title: data.title,
                company: data.company,
                description: data.description,
                deadline: data.deadline,
            },
        }, {
            onSuccess: (job) => {
                queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetWeeklyProgressQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetSkillBreakdownQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetUpcomingTasksQueryKey() });
                setResult({
                    jobId: job.id,
                    skills: job.extractedSkills,
                    difficulty: job.difficulty,
                    estimatedDays: job.estimatedDays,
                });
                toast({ title: "Job analyzed!", description: "Your personalized roadmap is ready." });
            },
            onError: (error) => {
                toast({ title: "Analysis failed", description: error.message ?? "Please try again.", variant: "destructive" });
            },
        });
    };
    const difficultyColor = { beginner: "secondary", intermediate: "default", advanced: "destructive" };
    return (<AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Upload Job Description</h1>
          <p className="text-muted-foreground text-sm mt-1">Type a job description or upload a readable file to build your roadmap.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!result ? (<motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <CardContent className="pt-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="title" render={({ field }) => (<FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Software Engineer" data-testid="input-job-title"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>)}/>
                        <FormField control={form.control} name="company" render={({ field }) => (<FormItem>
                            <FormLabel>Company (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g. Amazon" data-testid="input-company"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>)}/>
                      </div>

                      <FormField control={form.control} name="deadline" render={({ field }) => (<FormItem>
                          <FormLabel>Preparation Deadline</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary dark:text-white"/>
                              <Input {...field} type="date" min={new Date().toISOString().split("T")[0]} className="pl-9 text-foreground [color-scheme:light] dark:[color-scheme:dark]" data-testid="input-deadline"/>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>)}/>

                      <FormField control={form.control} name="description" render={({ field }) => (<FormItem>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <FormLabel>Job Description</FormLabel>
                            <div className="grid grid-cols-2 rounded-lg border border-border bg-muted/40 p-1">
                              <Button type="button" size="sm" variant={inputMode === "type" ? "default" : "ghost"} className="h-8 gap-2" onClick={() => setInputMode("type")}>
                                <Keyboard className="h-4 w-4"/> Type
                              </Button>
                              <Button type="button" size="sm" variant={inputMode === "file" ? "default" : "ghost"} className="h-8 gap-2" onClick={() => setInputMode("file")}>
                                <FileText className="h-4 w-4"/> File
                              </Button>
                            </div>
                          </div>
                          {inputMode === "file" && (<div className="rounded-xl border border-border bg-muted/30 p-4">
                            <Input
                              type="file"
                              accept="*/*"
                              onChange={(event) => loadDescriptionFile(event.target.files?.[0])}
                              data-testid="input-job-file"
                            />
                            {fileName && <p className="mt-2 text-xs text-muted-foreground">Loaded {fileName}</p>}
                          </div>)}
                          <div className={`relative border-2 border-dashed rounded-xl p-3 transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}>
                            <FormControl>
                              <Textarea {...field} placeholder="Paste the job description here, or drag and drop a .txt file..." rows={10} className="border-0 resize-none focus-visible:ring-0 p-0 bg-transparent" data-testid="textarea-description"/>
                            </FormControl>
                            {dragOver && (<div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-xl pointer-events-none">
                                <div className="text-primary font-medium text-sm flex items-center gap-2">
                                  <Upload className="w-5 h-5"/> Drop file here
                                </div>
                              </div>)}
                          </div>
                          <FormMessage />
                        </FormItem>)}/>

                      <Button type="submit" className="w-full gap-2" disabled={createJob.isPending} data-testid="button-analyze">
                        {createJob.isPending ? (<><Loader2 className="w-4 h-4 animate-spin"/> Generating roadmap...</>) : (<><Sparkles className="w-4 h-4"/> Analyze & Generate Roadmap</>)}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>) : (<motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5"/> Analysis Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="text-center p-4 rounded-lg border border-border bg-card flex-1">
                      <p className="text-2xl font-bold text-primary">{result.estimatedDays}</p>
                      <p className="text-xs text-muted-foreground">Preparation Days</p>
                    </div>
                    <div className="text-center p-4 rounded-lg border border-border bg-card flex-1">
                      <p className="text-2xl font-bold text-primary">{result.skills.length}</p>
                      <p className="text-xs text-muted-foreground">Skills Extracted</p>
                    </div>
                    <div className="text-center p-4 rounded-lg border border-border bg-card flex-1">
                      <Badge variant={difficultyColor[result.difficulty]} className="capitalize">
                        {result.difficulty}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Difficulty</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-3">Extracted Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {result.skills.map(skill => (<Badge key={skill} variant="outline" className="text-xs" data-testid={`skill-badge-${skill}`}>
                          {skill}
                        </Badge>))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 gap-2" onClick={() => setLocation(`/roadmap/${result.jobId}`)} data-testid="button-view-roadmap">
                      View Roadmap
                    </Button>
                    <Button variant="outline" onClick={() => setResult(null)} data-testid="button-upload-another">
                      Upload Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>)}
        </AnimatePresence>
      </div>
    </AppLayout>);
}
