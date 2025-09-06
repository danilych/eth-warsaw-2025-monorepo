import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import QuestDetail from "./pages/QuestDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Get Civic Client ID from environment variables
const CIVIC_CLIENT_ID = '49631f1e-af8d-4112-8b72-8c108575ccef';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider clientId={CIVIC_CLIENT_ID}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/quest/:id" element={<QuestDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
