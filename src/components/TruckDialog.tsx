import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import type { Truck } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Truck, 'id'>) => void;
  truck?: Truck | null;
}

export default function TruckDialog({ open, onClose, onSave, truck }: Props) {
  const [name, setName] = useState('');
  const [depth, setDepth] = useState('1360');
  const [width, setWidth] = useState('240');
  const [height, setHeight] = useState('270');
  const [maxWeight, setMaxWeight] = useState('24000');
  const [cost, setCost] = useState('0');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (truck) {
        setName(truck.name);
        setDepth(String(truck.depth));
        setWidth(String(truck.width));
        setHeight(String(truck.height));
        setMaxWeight(String(truck.maxWeight));
        setCost(String(truck.cost));
      } else {
        setName(t('trucks.form.defaultName'));
        setDepth('1360');
        setWidth('240');
        setHeight('270');
        setMaxWeight('24000');
        setCost('0');
      }
      setError('');
    }
  }, [open, truck]);

  function validate(): string | null {
    if (!name.trim()) return t('trucks.validation.nameRequired');
    if (parseFloat(width) <= 0) return t('trucks.validation.widthRequired');
    if (parseFloat(height) <= 0) return t('trucks.validation.heightRequired');
    if (parseFloat(depth) <= 0) return t('trucks.validation.lengthRequired');
    if (parseFloat(maxWeight) <= 0) return t('trucks.validation.maxWeightRequired');
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    onSave({
      name: name.trim(),
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0,
      depth: parseFloat(depth) || 0,
      maxWeight: parseFloat(maxWeight) || 0,
      cost: parseFloat(cost) || 0,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {truck ? t('trucks.editTitle') : t('trucks.addTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3.5 py-2">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('trucks.form.name')}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('trucks.form.namePlaceholder')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('trucks.form.length')}
            </Label>
            <Input type="number" value={depth} onChange={(e) => setDepth(e.target.value)} min="1" step="1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('trucks.form.width')}
            </Label>
            <Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} min="1" step="1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('trucks.form.height')}
            </Label>
            <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} min="1" step="1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('trucks.form.maxWeight')}
            </Label>
            <Input type="number" value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} min="1" step="1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('trucks.form.cost')}
            </Label>
            <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} min="0" step="1" />
          </div>
          <div className="flex flex-col gap-1.5" />
        </div>
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 text-sm rounded-md">
            {error}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('modal.cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('modal.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
