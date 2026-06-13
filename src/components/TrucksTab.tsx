import { useState, useRef } from 'react';
import { Plus, Upload, Download, Pencil, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t, fmt, fmtDec } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/components/ui/alert-provider';
import { useConfirm } from '@/components/ui/confirm-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TruckDialog from './TruckDialog';
import type { Truck } from '@/lib/types';

export default function TrucksTab() {
  const { alert } = useAlert();
  const { confirm } = useConfirm();
  const trucks = useAppStore((s) => s.trucks);
  const addTruck = useAppStore((s) => s.addTruck);
  const updateTruck = useAppStore((s) => s.updateTruck);
  const removeTruck = useAppStore((s) => s.removeTruck);
  const setTrucks = useAppStore((s) => s.setTrucks);
  const loadDefaultTrucks = useAppStore((s) => s.loadDefaultTrucks);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSave(data: Omit<Truck, 'id'>) {
    if (editingTruck) {
      updateTruck(editingTruck.id, data);
    } else {
      addTruck(data);
    }
    setDialogOpen(false);
    setEditingTruck(null);
  }

  function handleEdit(truck: Truck) {
    setEditingTruck(truck);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingTruck(null);
    setDialogOpen(true);
  }

  async function handleDelete(truck: Truck) {
    const confirmed = await confirm({
      description: t('confirm.deleteTruck', { name: truck.name }),
    });
    if (confirmed) {
      removeTruck(truck.id);
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data)) throw new Error(t('trucks.import.invalidFormat'));
        const sanitized = data.map((item: Record<string, unknown>) => ({
          id: (item.id as string) || ('t_' + Date.now().toString(36)),
          name: String(item.name || t('trucks.import.defaultName')),
          width: Number(item.width) || 240,
          height: Number(item.height) || 270,
          depth: Number(item.depth) || 1360,
          maxWeight: Number(item.maxWeight) || 24000,
          cost: Number(item.cost) || 0,
        }));
        setTrucks(sanitized);
      } catch (err) {
        alert(t('alert.importError', { error: (err as Error).message }), 'destructive');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleExport() {
    const json = JSON.stringify(trucks, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loadmaster_trucks.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">{t('trucks.title')}</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4" /> {t('trucks.addBtn')}
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" /> {t('trucks.importBtn')}
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4" /> {t('trucks.exportBtn')}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('trucks.col.name')}</TableHead>
              <TableHead className="text-center">{t('trucks.col.length')}</TableHead>
              <TableHead className="text-center">{t('trucks.col.width')}</TableHead>
              <TableHead className="text-center">{t('trucks.col.height')}</TableHead>
              <TableHead className="text-center">{t('trucks.col.volume')}</TableHead>
              <TableHead className="text-center">{t('trucks.col.maxWeight')}</TableHead>
              <TableHead className="text-center">{t('trucks.col.cost')}</TableHead>
              <TableHead className="text-center">{t('trucks.col.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trucks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  {t('trucks.empty')}{' '}
                  <Button variant="outline" className="ml-3" onClick={loadDefaultTrucks}>
                    {t('trucks.loadDefaults')}
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              trucks.map((tr) => (
                <TableRow key={tr.id}>
                  <TableCell className="font-semibold">{tr.name}</TableCell>
                  <TableCell className="text-center">{fmt(tr.depth)}</TableCell>
                  <TableCell className="text-center">{fmt(tr.width)}</TableCell>
                  <TableCell className="text-center">{fmt(tr.height)}</TableCell>
                  <TableCell className="text-center">{fmtDec((tr.width * tr.height * tr.depth) / 1e6, 1)}</TableCell>
                  <TableCell className="text-center">{fmt(tr.maxWeight)}</TableCell>
                  <TableCell className="text-center">{fmt(tr.cost)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-1 justify-end">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-orange-500 hover:text-orange-600"
              onClick={() => handleEdit(tr)}
            >
              <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(tr)}
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

      <TruckDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingTruck(null); }}
        onSave={handleSave}
        truck={editingTruck}
      />
    </div>
  );
}
