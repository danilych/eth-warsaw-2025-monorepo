import '@rainbow-me/rainbowkit/styles.css';
// biome-ignore lint/correctness/noUnusedImports: <explanation>
import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import QuestsPage from './pages/QuestsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { AuthPage } from './pages/AuthPage';
import { CivicAuthProvider } from '@civic/auth-web3/react';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { zetachainAthensTestnet } from 'viem/chains';
import { WagmiProvider } from 'wagmi';

const config = getDefaultConfig({
  appName: 'HashWay',
  projectId: 'c5c5db8b1082ef2290e64e48cd5ed41f',
  chains: [zetachainAthensTestnet],
  ssr: false,
});

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <CivicAuthProvider clientId="49631f1e-af8d-4112-8b72-8c108575ccef">
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
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </CivicAuthProvider>
  </WagmiProvider>
);

export default App;
