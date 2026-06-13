import { useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, Zap } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t, fmt, fmtDec } from '@/lib/i18n';
import { optimizeLoading } from '@/lib/packing';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/components/ui/alert-provider';
import { useConfirm } from '@/components/ui/confirm-provider';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PalletDialog from './PalletDialog';
import type { Pallet } from '@/lib/types';

export default function PalletsTab() {
  const { alert } = useAlert();
  const { confirm } = useConfirm();
  const pallets = useAppStore((s) => s.pallets);
  const trucks = useAppStore((s) => s.trucks);
  const addPallet = useAppStore((s) => s.addPallet);
  const addPalletBatch = useAppStore((s) => s.addPalletBatch);
  const updatePallet = useAppStore((s) => s.updatePallet);
  const removePallet = useAppStore((s) => s.removePallet);
  const clearPallets = useAppStore((s) => s.clearPallets);
  const setResults = useAppStore((s) => s.setResults);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPallet, setEditingPallet] = useState<Pallet | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  const totals = {
    count: pallets.length,
    totalVolume: pallets.reduce((s, p) => s + p.length * p.width * p.height, 0) / 1e6,
    totalWeight: pallets.reduce((s, p) => s + p.weight, 0),
  };

  function handleSave(data: Omit<Pallet, 'id'>, qty: number) {
    if (editingPallet) {
      updatePallet(editingPallet.id, data);
    } else if (qty > 1) {
      addPalletBatch(data, qty);
    } else {
      addPallet(data);
    }
    setDialogOpen(false);
    setEditingPallet(null);
  }

  function handleEdit(pallet: Pallet) {
    setEditingPallet(pallet);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingPallet(null);
    setDialogOpen(true);
  }

  async function handleDelete(pallet: Pallet) {
    const confirmed = await confirm({
      description: t('confirm.deletePallet', { id: pallet.id }),
    });
    if (confirmed) {
      removePallet(pallet.id);
    }
  }

  async function handleClear() {
    const confirmed = await confirm({
      description: t('confirm.clearPallets'),
    });
    if (confirmed) {
      clearPallets();
    }
  }

  const handleOptimize = useCallback(() => {
    if (!pallets.length) { alert(t('alert.noPallets'), 'warning'); return; }
    if (!trucks.length) { alert(t('alert.noTrucks'), 'warning'); return; }

    setOptimizing(true);
    setTimeout(() => {
      try {
        const results = optimizeLoading(pallets, trucks);
        setResults(results);
        setActiveTab('results');
      } catch (err) {
        alert(t('alert.optimizationError', { error: (err as Error).message }), 'destructive');
      } finally {
        setOptimizing(false);
      }
    }, 80);
  }, [pallets, trucks, setResults, setActiveTab]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">{t('pallets.title')}</h2>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4" /> {t('pallets.addBtn')}
          </Button>
          <Button onClick={handleClear} className="bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500">
            <Trash2 className="w-4 h-4" /> {t('pallets.clearBtn')}
          </Button>
          <Button
            onClick={handleOptimize}
            disabled={optimizing}
            className="bg-amber-400 text-amber-950 hover:bg-amber-500 dark:bg-amber-600 dark:text-white dark:hover:bg-amber-500"
          >
            <Zap className="w-4 h-4" /> {t('pallets.optimizeBtn')}
          </Button>
        </div>
      </div>

      {optimizing && (
        <div className="mb-3 h-1.5 bg-secondary overflow-hidden">
          <div className="h-full w-1/3 bg-primary animate-pulse" />
        </div>
      )}

      <div className="overflow-x-auto border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">{t('pallets.col.id')}</TableHead>
              <TableHead className="min-w-[220px]">{t('pallets.col.name')}</TableHead>
              <TableHead className="text-center">{t('pallets.col.length')}</TableHead>
              <TableHead className="text-center">{t('pallets.col.width')}</TableHead>
              <TableHead className="text-center">{t('pallets.col.height')}</TableHead>
              <TableHead className="text-center">{t('pallets.col.weight')}</TableHead>
              <TableHead className="text-center">{t('pallets.col.stackable')}</TableHead>
              <TableHead className="text-center">{t('pallets.col.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pallets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  {t('pallets.empty')}
                </TableCell>
              </TableRow>
            ) : (
              pallets.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-center">
                    <span className="font-mono font-semibold bg-accent px-1.5 py-0.5 text-sm">
                      {p.id}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    {p.label ? (
                      <span className="text-sm truncate inline-block max-w-[250px]">{p.label}</span>
                    ) : (
                      <span className="text-muted-foreground opacity-45">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{fmt(p.length)}</TableCell>
                  <TableCell className="text-center">{fmt(p.width)}</TableCell>
                  <TableCell className="text-center">{fmt(p.height)}</TableCell>
                  <TableCell className="text-center">{fmt(p.weight)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={p.stackable ? 'default' : 'destructive'}>
                      {p.stackable ? t('pallets.stackable.yes') : t('pallets.stackable.no')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-1 justify-end">
            <Button variant="outline" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-600" onClick={() => handleEdit(p)}>
              <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(p)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pallets.length > 0 && (
        <div className="flex gap-6 text-sm text-muted-foreground mt-3 mb-3 px-4 py-2.5 bg-accent border border-border rounded-md">
          <span>
            <span className="text-foreground font-medium">{pallets.length}</span>{' '}
            {t('pallets.summary.unit')}
          </span>
          <span>
            <span className="text-foreground font-medium">{fmtDec(totals.totalVolume, 2)}</span> m³
          </span>
          <span>
            <span className="text-foreground font-medium">{fmt(totals.totalWeight)}</span> kg
          </span>
        </div>
      )}

      <PalletDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingPallet(null); }}
        onSave={handleSave}
        pallet={editingPallet}
      />
    </div>
  );
}
