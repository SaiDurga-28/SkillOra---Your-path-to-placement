import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import LandingPage from "@/views/pages/landing";
import LoginPage from "@/views/pages/login";
import RegisterPage from "@/views/pages/register";
import DashboardPage from "@/views/pages/dashboard";
import UploadPage from "@/views/pages/upload";
import JobsPage from "@/views/pages/jobs";
import JobDetailPage from "@/views/pages/job-detail";
import RoadmapPage from "@/views/pages/roadmap";
import InterviewsPage from "@/views/pages/interviews";
import InterviewSessionPage from "@/views/pages/interview-session";
import CrtPage from "@/views/pages/crt";
import ResumeAnalyzerPage from "@/views/pages/resume-analyzer";
import SettingsPage from "@/views/pages/settings";
import NotFound from "@/views/pages/not-found";
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
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>);
}
export default App;
