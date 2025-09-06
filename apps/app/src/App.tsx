// biome-ignore lint/correctness/noUnusedImports: <explanation>
import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { zetachainAthensTestnet } from 'wagmi/chains';
import { WagmiProvider } from 'wagmi';
import { AuthPage } from './pages/AuthPage';
import QuestsPage from './pages/QuestsPage';

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: 'HashWay',
  projectId: 'c5c5db8b1082ef2290e64e48cd5ed41f',
  chains: [zetachainAthensTestnet],
});

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/quests" element={<QuestsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
