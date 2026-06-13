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
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import type { Pallet } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Pallet, 'id'>, qty: number) => void;
  pallet?: Pallet | null;
}

export default function PalletDialog({ open, onClose, onSave, pallet }: Props) {
  const [label, setLabel] = useState('');
  const [length, setLength] = useState('120');
  const [width, setWidth] = useState('80');
  const [height, setHeight] = useState('150');
  const [weight, setWeight] = useState('300');
  const [qty, setQty] = useState('1');
  const [stackable, setStackable] = useState(false);
  const [error, setError] = useState('');

  const isNew = !pallet;

  useEffect(() => {
    if (open) {
      if (pallet) {
        setLabel(pallet.label);
        setLength(String(pallet.length));
        setWidth(String(pallet.width));
        setHeight(String(pallet.height));
        setWeight(String(pallet.weight));
        setStackable(pallet.stackable);
        setQty('1');
      } else {
        setLabel('');
        setLength('120');
        setWidth('80');
        setHeight('150');
        setWeight('300');
        setStackable(false);
        setQty('1');
      }
      setError('');
    }
  }, [open, pallet]);

  function validate(): string | null {
    if (parseFloat(length) <= 0) return t('pallets.validation.lengthRequired');
    if (parseFloat(width) <= 0) return t('pallets.validation.widthRequired');
    if (parseFloat(height) <= 0) return t('pallets.validation.heightRequired');
    if (parseFloat(weight) < 0) return t('pallets.validation.weightNegative');
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    onSave(
      {
        label: label.trim(),
        length: parseFloat(length) || 0,
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
        weight: parseFloat(weight) || 0,
        stackable,
      },
      parseInt(qty, 10) || 1
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isNew ? t('pallets.addTitle') : t('pallets.editTitle', { id: pallet!.id })}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3.5 py-2">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('pallets.form.label')}{' '}
              <span className="font-normal lowercase tracking-normal opacity-60">
                {t('pallets.form.labelOptional')}
              </span>
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('pallets.form.labelPlaceholder')}
              maxLength={60}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('pallets.form.length')}
            </Label>
            <Input type="number" value={length} onChange={(e) => setLength(e.target.value)} min="1" step="1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('pallets.form.width')}
            </Label>
            <Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} min="1" step="1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('pallets.form.height')}
            </Label>
            <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} min="1" step="1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('pallets.form.weight')}
            </Label>
            <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} min="0" step="0.1" />
          </div>
          {isNew && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t('pallets.form.qty')}
              </Label>
              <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="1" max="500" step="1" />
            </div>
          )}
          <div className="col-span-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-foreground">
              <Checkbox
                checked={stackable}
                onCheckedChange={(c) => setStackable(c === true)}
                id="f-stackable"
              />
              <span>{t('pallets.form.stackable')}</span>
            </label>
          </div>
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
            {isNew ? t('modal.add') : t('modal.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
