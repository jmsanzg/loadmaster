import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AlertProvider } from '@/components/ui/alert-provider';
import { ConfirmProvider } from '@/components/ui/confirm-provider';
import Header from '@/components/Header';
import TrucksTab from '@/components/TrucksTab';
import PalletsTab from '@/components/PalletsTab';
import ResultsTab from '@/components/ResultsTab';

export default function App() {
  const activeTab = useAppStore((s) => s.activeTab);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <AlertProvider>
      <ConfirmProvider>
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <Header />
          <main className="flex-1 p-6 max-w-[1400px] mx-auto w-full">
            {activeTab === 'trucks' && <TrucksTab />}
            {activeTab === 'pallets' && <PalletsTab />}
            {activeTab === 'results' && <ResultsTab />}
          </main>
          <div id="vis-tooltip" className="hidden fixed bg-card border border-border px-3 py-2 text-xs leading-relaxed text-foreground pointer-events-none z-[9999] max-w-[220px] shadow-lg" />
        </div>
      </ConfirmProvider>
    </AlertProvider>
  );
}
