import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/AuthPage";
import OnboardingPage from "@/pages/OnboardingPage";

// Dashboard Pages
import Overview from "@/pages/Dashboard/Overview";
import WorldModel from "@/pages/Dashboard/WorldModel";
import IdeasEngine from "@/pages/Dashboard/IdeasEngine";
import CreativeHealth from "@/pages/Dashboard/CreativeHealth";
import WhatIfSimulator from "@/pages/Dashboard/WhatIfSimulator";
import MoodBoard from "@/pages/Dashboard/MoodBoard";
import Roadmap from "@/pages/Dashboard/Roadmap";
import RagChat from "@/pages/Dashboard/RagChat";
import Settings from "@/pages/Dashboard/Settings";

import { AuthProvider } from "@/context/AuthContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={OnboardingPage} />

      <Route path="/dashboard/overview" component={Overview} />
      <Route path="/dashboard/world-model" component={WorldModel} />
      <Route path="/dashboard/ideas" component={IdeasEngine} />
      <Route path="/dashboard/health" component={CreativeHealth} />
      <Route path="/dashboard/simulator" component={WhatIfSimulator} />
      <Route path="/dashboard/mood-board" component={MoodBoard} />
      <Route path="/dashboard/roadmap" component={Roadmap} />
      <Route path="/dashboard/chat" component={RagChat} />
      <Route path="/dashboard/settings" component={Settings} />

      {/* Redirect base /dashboard to overview */}
      <Route path="/dashboard">
        {() => { window.location.href = "/dashboard/overview"; return null; }}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
