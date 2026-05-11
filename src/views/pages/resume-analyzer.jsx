import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, FileText, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAnalyzeResume } from "@/api";

function extractPdfText(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index]);
    }
    const strings = [];
    const textMatches = binary.matchAll(/\(([^()]|\\[()\\nrtbf]){2,}\)/g);
    for (const match of textMatches) {
        strings.push(match[0].slice(1, -1).replace(/\\n/g, " ").replace(/\\r/g, " ").replace(/\\t/g, " ").replace(/\\([()\\])/g, "$1"));
    }
    const tjMatches = binary.matchAll(/<([0-9A-Fa-f]{4,})>/g);
    for (const match of tjMatches) {
        const hex = match[1];
        if (hex.length % 4 !== 0) continue;
        const chars = [];
        for (let index = 0; index < hex.length; index += 4) {
            const code = parseInt(hex.slice(index, index + 4), 16);
            if (code >= 32 && code <= 126) chars.push(String.fromCharCode(code));
        }
        if (chars.length > 2) strings.push(chars.join(""));
    }
    return strings.join(" ").replace(/\s+/g, " ").trim();
}

export default function ResumeAnalyzerPage() {
    const { toast } = useToast();
    const fileInputRef = useRef(null);
    const analyzeResume = useAnalyzeResume();
    const [fileName, setFileName] = useState("");
    const [report, setReport] = useState(null);
    const [extractedTextLength, setExtractedTextLength] = useState(0);
    const sectionScores = report?.sectionScores ? Object.entries(report.sectionScores) : [];
    const score = report?.atsScore ?? 0;

    const handleFile = async (file) => {
        if (!file) return;
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            toast({ title: "Upload a PDF resume", variant: "destructive" });
            return;
        }
        setFileName(file.name);
        setReport(null);
        const buffer = await file.arrayBuffer();
        const resumeText = extractPdfText(buffer);
        setExtractedTextLength(resumeText.length);
        if (resumeText.length < 80) {
            toast({
                title: "Could not read enough resume text",
                description: "Use a text-based PDF. Scanned image resumes need OCR before analysis.",
                variant: "destructive",
            });
            return;
        }
        analyzeResume.mutate({ data: { fileName: file.name, resumeText } }, {
            onSuccess: (result) => {
                setReport(result);
                toast({ title: `Resume analyzed: ${result.atsScore}% ATS score` });
            },
            onError: () => toast({ title: "Resume analysis failed", variant: "destructive" }),
        });
    };

    return (<AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Resume Analyzer</h1>
          <p className="text-muted-foreground text-sm mt-1">Upload a PDF resume to get an ATS score and practical improvement report.</p>
        </motion.div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5"/>
                </div>
                <div>
                  <p className="font-semibold">{fileName || "No resume uploaded yet"}</p>
                  <p className="text-xs text-muted-foreground">{extractedTextLength ? `${extractedTextLength.toLocaleString()} characters extracted` : "PDF only"}</p>
                </div>
              </div>
              <div>
                <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} data-testid="input-resume-pdf"/>
                <Button onClick={() => fileInputRef.current?.click()} disabled={analyzeResume.isPending} className="gap-2" data-testid="button-upload-resume">
                  {analyzeResume.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <UploadCloud className="h-4 w-4"/>}
                  {analyzeResume.isPending ? "Analyzing..." : "Upload Resume"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {report ? (<div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary"/> ATS Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-5xl font-bold text-primary">{score}%</p>
                <Progress value={score} className="mt-3 h-3"/>
                <p className="mt-3 text-sm text-muted-foreground">{report.summary}</p>
              </div>
              <div className="space-y-3">
                {sectionScores.map(([section, value]) => (<div key={section}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{section}</span>
                    <span className="font-medium">{value}%</span>
                  </div>
                  <Progress value={value} className="h-2"/>
                </div>))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500"/> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {(report.strengths ?? []).length ? report.strengths.map(item => <Badge key={item} variant="secondary">{item}</Badge>) : <p className="text-sm text-muted-foreground">No strong ATS signals found yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-orange-500"/> Improvements To Raise ATS Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(report.improvements ?? []).map((item, index) => (<div key={item} className="flex gap-3 rounded-lg border border-border p-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                    <p className="text-sm">{item}</p>
                  </div>))}
                </div>
              </CardContent>
            </Card>

            {(report.missingKeywords ?? []).length > 0 && (<Card>
              <CardHeader>
                <CardTitle className="text-sm">Missing Keyword Ideas</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {report.missingKeywords.map(keyword => <Badge key={keyword} variant="outline">{keyword}</Badge>)}
              </CardContent>
            </Card>)}
          </div>
        </div>) : (<Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30"/>
            <p className="text-sm text-muted-foreground">Your ATS report will appear here after uploading a readable PDF resume.</p>
          </CardContent>
        </Card>)}
      </div>
    </AppLayout>);
}
