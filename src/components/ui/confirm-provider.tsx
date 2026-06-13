import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

interface ConfirmOptions {
  title?: string;
  description: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

let resolveRef: ((value: boolean) => void) | null = null;

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef = resolve;
      setOptions(opts);
      setOpen(true);
    });
  }, []);

  function handleResolve(value: boolean) {
    setOpen(false);
    if (resolveRef) {
      resolveRef(value);
      resolveRef = null;
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleResolve(false);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{options?.title || t('confirm.title')}</DialogTitle>
            {options?.description && (
              <DialogDescription>{options.description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleResolve(false)}>
              {t('confirm.cancel')}
            </Button>
            <Button onClick={() => handleResolve(true)}>
              {t('confirm.continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
