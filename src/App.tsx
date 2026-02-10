import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Pferde from "./pages/app/Pferde";
import Chat from "./pages/app/Chat";
import Notizen from "./pages/app/Notizen";
import Termine from "./pages/app/Termine";
import Kunden from "./pages/app/Kunden";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/app/pferde" element={<AppLayout><Pferde /></AppLayout>} />
          <Route path="/app/chat" element={<AppLayout><Chat /></AppLayout>} />
          <Route path="/app/notizen" element={<AppLayout><Notizen /></AppLayout>} />
          <Route path="/app/termine" element={<AppLayout><Termine /></AppLayout>} />
          <Route path="/app/kunden" element={<AppLayout><Kunden /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
