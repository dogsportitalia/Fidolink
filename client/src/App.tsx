import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/header";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";
import EditProfilePage from "@/pages/edit-profile";
import PublicScanPage from "@/pages/public-scan";
import AdminPage from "@/pages/admin";
import LegalPage from "@/pages/legal";
import ResetPasswordPage from "@/pages/reset-password";
import LocationPage from "@/pages/location";

function usePageVisitTracker() {
  useEffect(() => {
    const hasVisited = sessionStorage.getItem("visited");
    if (!hasVisited) {
      fetch("/api/visit", { method: "POST" }).catch(() => {});
      sessionStorage.setItem("visited", "1");
    }
  }, []);
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/edit/:tagId" component={EditProfilePage} />
      <Route path="/t/:publicId" component={PublicScanPage} />
      <Route path="/teodorosrls" component={AdminPage} />
      <Route path="/legal" component={LegalPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/location/:token" component={LocationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  usePageVisitTracker();
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background">
              <Header />
              <Router />
            </div>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
