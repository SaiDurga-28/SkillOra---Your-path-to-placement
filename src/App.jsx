import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import UploadPage from "@/pages/upload";
import JobsPage from "@/pages/jobs";
import JobDetailPage from "@/pages/job-detail";
import RoadmapPage from "@/pages/roadmap";
import InterviewsPage from "@/pages/interviews";
import InterviewSessionPage from "@/pages/interview-session";
import CrtPage from "@/pages/crt";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
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
