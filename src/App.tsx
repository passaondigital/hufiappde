import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import AGB from "./pages/AGB";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Pferde from "./pages/app/Pferde";
import Chat from "./pages/app/Chat";
import Notizen from "./pages/app/Notizen";
import Termine from "./pages/app/Termine";
import Kunden from "./pages/app/Kunden";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Tresor from "./pages/app/Tresor";
import Einstellungen from "./pages/app/Einstellungen";
import HuufiConnect from "./pages/app/HuufiConnect";
import Feedback from "./pages/app/Feedback";
import KnowledgeVault from "./pages/app/KnowledgeVault";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-background"><p className="text-muted-foreground">Laden...</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/impressum" element={<Impressum />} />
      <Route path="/datenschutz" element={<Datenschutz />} />
      <Route path="/agb" element={<AGB />} />
      <Route path="/app" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/app/pferde" element={<ProtectedRoute><AppLayout><Pferde /></AppLayout></ProtectedRoute>} />
      <Route path="/app/chat" element={<ProtectedRoute><AppLayout><Chat /></AppLayout></ProtectedRoute>} />
      <Route path="/app/notizen" element={<ProtectedRoute><AppLayout><Notizen /></AppLayout></ProtectedRoute>} />
      <Route path="/app/termine" element={<ProtectedRoute><AppLayout><Termine /></AppLayout></ProtectedRoute>} />
      <Route path="/app/kunden" element={<ProtectedRoute><AppLayout><Kunden /></AppLayout></ProtectedRoute>} />
      <Route path="/app/tresor" element={<ProtectedRoute><AppLayout><Tresor /></AppLayout></ProtectedRoute>} />
      <Route path="/app/einstellungen" element={<ProtectedRoute><AppLayout><Einstellungen /></AppLayout></ProtectedRoute>} />
      <Route path="/app/connect" element={<ProtectedRoute><AppLayout><HuufiConnect /></AppLayout></ProtectedRoute>} />
      <Route path="/app/feedback" element={<ProtectedRoute><AppLayout><Feedback /></AppLayout></ProtectedRoute>} />
      <Route path="/app/wissen" element={<ProtectedRoute><AppLayout><KnowledgeVault /></AppLayout></ProtectedRoute>} />
      <Route path="/app/admin" element={<ProtectedRoute><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import CookieBanner from "./components/CookieBanner";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <CookieBanner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
