import { motion } from "framer-motion";
import { Link } from "wouter";
import { Upload, Map, Mic, BarChart3, ArrowRight, Zap, Target, Sun, Moon, Sparkles, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import { SkillOraLogo } from "@/components/brand/skillora-logo";
const features = [
    {
        icon: Upload,
        title: "Smart JD Analysis",
        desc: "Upload any job description — text, PDF or paste directly. Our AI extracts every required skill instantly.",
    },
    {
        icon: Map,
        title: "Personalized Roadmap",
        desc: "Get an adaptive preparation plan covering technical skills, assessments, and communication.",
    },
    {
        icon: Mic,
        title: "AI Mock Interviews",
        desc: "Practice HR and technical interviews with instant AI feedback and performance scoring.",
    },
    {
        icon: BarChart3,
        title: "Progress Analytics",
        desc: "Track your daily streak, skill completion, and preparation analytics on a beautiful dashboard.",
    },
];
const steps = [
    { num: "01", title: "Upload Job Description", desc: "Paste text or upload a file of any job posting you are targeting." },
    { num: "02", title: "AI Analyzes & Extracts", desc: "Our AI identifies required skills, technologies, and difficulty level." },
    { num: "03", title: "Get Your Roadmap", desc: "Receive a personalized preparation plan instantly." },
    { num: "04", title: "Practice & Track", desc: "Complete tasks, take mock interviews, and monitor your progress." },
];
const testimonials = [
    { name: "Arjun Sharma", role: "SDE at Amazon", text: "The roadmap feature is incredible. I went from confused to confident in just 3 weeks.", avatar: "AS" },
    { name: "Priya Nair", role: "Data Analyst at Flipkart", text: "The assessments helped me ace the aptitude round which I always struggled with.", avatar: "PN" },
    { name: "Rohan Mehta", role: "Full Stack Dev at Razorpay", text: "Mock interviews with AI feedback transformed how I communicate in technical rounds.", avatar: "RM" },
];
export default function LandingPage() {
    const { theme, toggleTheme } = useTheme();
    const { isAuthenticated } = useAuth();
    return (<div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <SkillOraLogo />
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
            {theme === "dark" ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
          </Button>
          {isAuthenticated ? (<Link href="/dashboard">
              <Button size="sm" data-testid="button-go-dashboard">Dashboard</Button>
            </Link>) : (<>
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" data-testid="button-get-started">Get Started</Button>
              </Link>
            </>)}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"/>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl"/>
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
              <Zap className="w-3 h-3"/>
              AI-Powered Placement Preparation
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              SkillOra Turns Any Job Description Into Your{" "}
              <span className="text-primary">Personalized Placement</span>{" "}
              Preparation Roadmap
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Upload a job description and let AI extract required skills, build a focused roadmap, and guide you through technical prep, assessments, and mock interviews.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="gap-2" data-testid="button-hero-get-started">
                  Start Learning <ArrowRight className="w-4 h-4"/>
                </Button>
              </Link>
              <Link href="/upload">
                <Button size="lg" variant="outline" className="gap-2" data-testid="button-hero-upload-jd">
                  <Upload className="w-4 h-4"/> Upload JD
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="grid grid-cols-3 gap-6 mt-16 max-w-lg mx-auto">
            {[["10K+", "Students"], ["95%", "Success Rate"], ["50+", "Companies"]].map(([val, label]) => (<div key={label} className="text-center">
                <div className="text-2xl font-bold text-primary">{val}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to land the job</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">From skill extraction to mock interviews, every tool built for placement success.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (<motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary"/>
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground">Four steps from job description to interview ready.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, i) => (<motion.div key={step.num} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex gap-4 p-6 rounded-xl border border-border bg-card">
                <div className="text-2xl font-black text-primary/30 leading-none">{step.num}</div>
                <div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Trusted by placement winners</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (<motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-6 rounded-xl border border-border bg-card">
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="p-12 rounded-2xl border border-primary/20 bg-primary/5">
            <Target className="w-10 h-10 text-primary mx-auto mb-4"/>
            <h2 className="text-3xl font-bold mb-4">Start your preparation today</h2>
            <p className="text-muted-foreground mb-8">Join thousands of students who landed their dream jobs with AI-powered preparation.</p>
            <Link href="/register">
              <Button size="lg" className="gap-2" data-testid="button-cta-register">
                Create Free Account <ArrowRight className="w-4 h-4"/>
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/20 bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.35fr_1fr_1fr]">
            <div className="border-b border-border p-6 lg:border-b-0 lg:border-r">
              <SkillOraLogo />
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                A focused workspace for JD analysis, roadmaps, assessments, communication practice, and mock interviews.
              </p>
            </div>
            <div className="grid grid-cols-2 border-b border-border lg:border-b-0">
              <div className="border-r border-border p-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Prepare</p>
                {[
                  ["Upload JD", "/upload"],
                  ["Assessments", "/crt"],
                  ["Mock Interviews", "/interviews"],
                  ["Dashboard", "/dashboard"],
                ].map(([label, href]) => (
                  <Link key={label} href={href} className="group mb-2 flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                    {label}<ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"/>
                  </Link>
                ))}
              </div>
              <div className="p-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Practice</p>
                {[
                  ["Roadmaps", "/jobs"],
                  ["Communication", "/crt"],
                  ["Settings", "/settings"],
                  ["Home", "/"],
                ].map(([label, href]) => (
                  <Link key={label} href={href} className="group mb-2 flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                    {label}<ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"/>
                  </Link>
                ))}
              </div>
            </div>
            <div className="bg-primary/5 p-6">
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-5 w-5"/>
                  </div>
                  <p className="text-sm font-semibold">Keep your prep moving.</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Upload one JD, complete today’s roadmap tasks, and practice one answer every day.</p>
                </div>
                <div className="space-y-2 text-sm">
                  <a href="mailto:skilloraconnect@gmail.com" aria-label="Email SkillOra" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
                    <Mail className="h-4 w-4 shrink-0"/>
                    <span>skilloraconnect@gmail.com</span>
                  </a>
                  <a href="https://www.linkedin.com/in/skill-ora-41368640a/" target="_blank" rel="noreferrer" aria-label="SkillOra LinkedIn" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
                    <Linkedin className="h-4 w-4 shrink-0"/>
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>);
}
