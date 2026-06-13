import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type AlertVariant = 'info' | 'warning' | 'destructive';

interface AlertItem {
  id: number;
  title: string;
  message: string;
  variant: AlertVariant;
}

interface AlertContextValue {
  alert: (message: string, variant: AlertVariant) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

let nextId = 0;

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const alert = useCallback((message: string, variant: AlertVariant = 'info') => {
    const id = nextId++;
    const title = variant === 'destructive' ? 'Error' : variant === 'warning' ? 'Warning' : 'Information';
    setAlerts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 6000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {alerts.map((a) => (
          <Alert key={a.id} variant={a.variant === 'destructive' ? 'destructive' : 'default'} className="shadow-lg relative pr-8">
            <AlertTitle>{a.title}</AlertTitle>
            <AlertDescription>{a.message}</AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 size-6 opacity-70 hover:opacity-100"
              onClick={() => dismiss(a.id)}
            >
              <X className="size-3.5" />
            </Button>
          </Alert>
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
}
