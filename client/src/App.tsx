import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import AdminDashboard from "./pages/Admin";
import OwnerApp from "./pages/OwnerApp";
import Home from "./pages/Home";
import Login from "./pages/Login";

function LoadingScreen() {
  return <main className="loading-screen"><span className="brand-symbol"><i /><i /></span><p>Preparing your Westara space</p></main>;
}

function LoginRoute() {
  const auth = useAuth();
  if (auth.loading) return <LoadingScreen />;
  if (auth.user) return <Redirect to="/app" />;
  return <Login />;
}

function CustomerRoute() {
  const auth = useAuth();
  if (auth.loading) return <LoadingScreen />;
  if (!auth.user) return <Redirect to="/login" />;
  return <OwnerApp user={auth.user} />;
}

function AdminRoute() {
  const auth = useAuth();
  if (auth.loading) return <LoadingScreen />;
  if (!auth.user) return <Redirect to="/login" />;
  return <AdminDashboard user={auth.user} />;
}

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/login" component={LoginRoute} />
    <Route path="/app" component={CustomerRoute} />
    <Route path="/admin" component={AdminRoute} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>;
}
