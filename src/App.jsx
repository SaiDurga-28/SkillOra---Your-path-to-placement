import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
const LandingPage = lazy(() => import("@/views/pages/landing"));
const LoginPage = lazy(() => import("@/views/pages/login"));
const RegisterPage = lazy(() => import("@/views/pages/register"));
const DashboardPage = lazy(() => import("@/views/pages/dashboard"));
const UploadPage = lazy(() => import("@/views/pages/upload"));
const JobsPage = lazy(() => import("@/views/pages/jobs"));
const JobDetailPage = lazy(() => import("@/views/pages/job-detail"));
const RoadmapPage = lazy(() => import("@/views/pages/roadmap"));
const InterviewsPage = lazy(() => import("@/views/pages/interviews"));
const InterviewSessionPage = lazy(() => import("@/views/pages/interview-session"));
const CrtPage = lazy(() => import("@/views/pages/crt"));
const ResumeAnalyzerPage = lazy(() => import("@/views/pages/resume-analyzer"));
const SettingsPage = lazy(() => import("@/views/pages/settings"));
const NotFound = lazy(() => import("@/views/pages/not-found"));
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 30000,
        },
    },
});
function ProtectedRoute({ component: Component }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated)
        return <Redirect to="/login"/>;
    return <Component />;
}
function Router() {
    return (<Switch>
      <Route path="/" component={LandingPage}/>
      <Route path="/login" component={LoginPage}/>
      <Route path="/register" component={RegisterPage}/>
      <Route path="/dashboard"><ProtectedRoute component={DashboardPage}/></Route>
      <Route path="/upload"><ProtectedRoute component={UploadPage}/></Route>
      <Route path="/jobs"><ProtectedRoute component={JobsPage}/></Route>
      <Route path="/jobs/:jobId"><ProtectedRoute component={JobDetailPage}/></Route>
      <Route path="/roadmap/:jobId"><ProtectedRoute component={RoadmapPage}/></Route>
      <Route path="/interviews"><ProtectedRoute component={InterviewsPage}/></Route>
      <Route path="/interviews/:interviewId"><ProtectedRoute component={InterviewSessionPage}/></Route>
      <Route path="/crt"><ProtectedRoute component={CrtPage}/></Route>
      <Route path="/resume-analyzer"><ProtectedRoute component={ResumeAnalyzerPage}/></Route>
      <Route path="/settings"><ProtectedRoute component={SettingsPage}/></Route>
      <Route component={NotFound}/>
    </Switch>);
}
function App() {
    return (<QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Suspense fallback={<div className="min-h-screen bg-background" />}>
                <Router />
              </Suspense>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>);
}
export default App;
