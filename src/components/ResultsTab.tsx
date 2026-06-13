import { useRef, useCallback, useState } from 'react';
import { Download } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t, fmt, fmtDec } from '@/lib/i18n';
import { generatePDF } from '@/lib/pdf';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/components/ui/alert-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Visualizer, { type VisualizerHandle } from './Visualizer';

const COLORS_HEX = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD93D', '#96CEB4',
  '#C7F2A4', '#FF8B94', '#A8E6CF', '#F8B400', '#85C1E9',
  '#F7D794', '#778CA3', '#E77F67', '#786FA6', '#F8A5C2',
  '#63CDDA', '#CF6A87', '#574B90', '#3DC1D3', '#E15F41',
];

export default function ResultsTab() {
  const { alert } = useAlert();
  const results = useAppStore((s) => s.results);
  const resultsState = useAppStore((s) => s.resultsState);
  const language = useAppStore((s) => s.language);
  const visualizerRefs = useRef<Map<number, VisualizerHandle>>(new Map());
  const [selectedPallet, setSelectedPallet] = useState<{
    truckIndex: number;
    palletId: string;
  } | null>(null);

  const handleSelectPallet = useCallback(
    (truckIndex: number, palletId: string | null) => {
      if (palletId === null) {
        setSelectedPallet(null);
      } else {
        setSelectedPallet({ truckIndex, palletId });
      }
    },
    []
  );

  const handleRowClick = useCallback(
    (truckIndex: number, palletId: string) => {
      if (
        selectedPallet?.truckIndex === truckIndex &&
        selectedPallet?.palletId === palletId
      ) {
        setSelectedPallet(null);
        visualizerRefs.current.get(truckIndex)?.highlightPallet(null);
      } else {
        setSelectedPallet({ truckIndex, palletId });
        visualizerRefs.current.get(truckIndex)?.highlightPallet(palletId);
      }
    },
    [selectedPallet]
  );

  const handleDownloadPDF = useCallback(async () => {
    if (!results || !results.trucks.length) {
      alert(t('alert.noResults'), 'info');
      return;
    }
    try {
      await generatePDF(results, (truckIndex) => {
        const viz = visualizerRefs.current.get(truckIndex);
        return viz?.getScreenshot() ?? null;
      });
    } catch (err) {
      alert(t('alert.pdfError', { error: (err as Error).message }), 'destructive');
    }
  }, [results]);

  if (!results || resultsState !== 'loaded') {
    return (
      <p className="text-center py-16 text-muted-foreground">
        <span className="text-4xl mb-3 block">🎯</span>
        {resultsState === 'stale'
          ? t('results.stale')
          : (
            <>
              {t('results.initial')}<br />
              <strong>{t('results.initialAction')}</strong> {t('results.initialSuffix')}
            </>
          )}
      </p>
    );
  }

  if (!results.trucks.length && !results.unplaced.length) {
    return <p className="text-center py-16 text-muted-foreground">{t('results.empty')}</p>;
  }

  const totalLoaded = results.trucks.reduce((s, tr) => s + tr.placements.length, 0);

  return (
    <div>
      <div className="flex justify-end mb-3.5">
        <Button onClick={handleDownloadPDF}>
          <Download className="w-4 h-4" /> {t('results.downloadPdf')}
        </Button>
      </div>

      {/* Summary stats */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <Card className="flex-1 min-w-[120px]">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalLoaded}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('results.loaded')}</div>
          </CardContent>
        </Card>
        <Card className={`flex-1 min-w-[120px] ${results.unplaced.length ? 'border-destructive' : ''}`}>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${results.unplaced.length ? 'text-destructive' : ''}`}>
              {results.unplaced.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{t('results.unloaded')}</div>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[120px]">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{results.trucks.length}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('results.trucks')}</div>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[120px] border-primary">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{fmt(results.totalCost)} €</div>
            <div className="text-xs text-muted-foreground mt-1">{t('results.totalCost')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Unplaced pallets */}
      {results.unplaced.length > 0 && (
        <Card key={`unplaced-${language}`} className="mb-6 border-destructive bg-destructive/5">
          <CardHeader className="pb-2 flex flex-row items-center gap-3.5 flex-wrap bg-destructive/10 border-b border-destructive/20">
            <div className="flex flex-col gap-0.5">
              <div className="text-sm font-semibold">{t('results.unplacedTitle')}</div>
            </div>
            <Badge className="ml-auto" variant="destructive">
              {results.unplaced.length}{' '}
              {results.unplaced.length !== 1
                ? t('results.unplacedBadgePlural')
                : t('results.unplacedBadge')}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 overflow-x-auto">
            <h4 className="text-sm font-semibold text-destructive mb-2.5">
              {t('results.unplacedDetail')}{' '}
              <span className="text-xs normal-case font-normal tracking-normal opacity-70">
                {t('results.unplacedHint')}
              </span>
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('results.col.num')}</TableHead>
                  <TableHead>{t('results.col.palletId')}</TableHead>
                  <TableHead>{t('results.col.name')}</TableHead>
                  <TableHead>{t('results.col.dimensions')}</TableHead>
                  <TableHead>{t('results.col.weight')}</TableHead>
                  <TableHead>{t('results.col.stackable')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.unplaced.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <span className="inline-block px-2 py-0.5 border border-destructive font-mono font-bold text-sm bg-destructive/10 text-destructive">
                        {p.id}
                      </span>
                    </TableCell>
                    <TableCell>
                      {p.label ? (
                        <span className="text-sm">{p.label}</span>
                      ) : (
                        <span className="text-muted-foreground opacity-45">—</span>
                      )}
                    </TableCell>
                    <TableCell>{fmt(p.length)}×{fmt(p.width)}×{fmt(p.height)}</TableCell>
                    <TableCell>{fmt(p.weight)} kg</TableCell>
                    <TableCell>
                      <Badge variant={p.stackable ? 'default' : 'destructive'}>
                        {p.stackable ? t('pallets.stackable.yes') : t('pallets.stackable.no')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Truck result cards */}
      {results.trucks.map((truck, ti) => {
        const volPctVal = truck.volumeUtilization * 100;
        const wgtPctVal = (truck.totalWeight / truck.type.maxWeight) * 100;
        const volPct = fmtDec(volPctVal, 1);
        const wgtPct = fmtDec(wgtPctVal, 1);
        const colorMap = new Map(
          truck.placements.map((pl, i) => [pl, COLORS_HEX[i % COLORS_HEX.length]])
        );
        const sortedPlacements = [...truck.placements].sort((a, b) => a.z - b.z);
        const visId = `vis-truck-${ti}`;

        return (
          <Card key={`${ti}-${language}`} className="mb-6 overflow-hidden">
            <CardHeader className="p-4 border-b border-border flex flex-row items-center gap-3 flex-wrap">
              <div className="text-lg font-bold text-primary">
                {t('results.truckNum', { id: truck.id })}
              </div>
              <div className="font-semibold">{truck.type.name}</div>
              <div className="text-xs text-muted-foreground ml-auto">
                {fmt(truck.type.depth)}×{fmt(truck.type.width)}×{fmt(truck.type.height)} cm &nbsp;|&nbsp;
                {fmt(truck.type.cost)} € &nbsp;|&nbsp; {truck.placements.length}{' '}
                {t('results.pallets')}
              </div>
            </CardHeader>

            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2.5 mb-1.5 text-xs">
                <span className="text-muted-foreground w-[55px] shrink-0">{t('results.volume')}</span>
                <div className="flex-1 h-1.5 bg-secondary overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-400 bg-primary ${volPctVal > 90 ? '!bg-destructive' : ''}`}
                    style={{ width: `${Math.min(volPctVal, 100)}%` }}
                  />
                </div>
                <span className="text-muted-foreground min-w-[180px]">{volPct}%</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <span className="text-muted-foreground w-[55px] shrink-0">{t('results.weight')}</span>
                <div className="flex-1 h-1.5 bg-secondary overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-400 bg-muted-foreground ${wgtPctVal > 90 ? '!bg-destructive' : ''}`}
                    style={{ width: `${Math.min(wgtPctVal, 100)}%` }}
                  />
                </div>
                <span className="text-muted-foreground min-w-[180px]">
                  {wgtPct}% ({fmt(truck.totalWeight)}/{fmt(truck.type.maxWeight)} kg)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0">
              <div className="p-4 overflow-x-auto">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2.5">
                  {t('results.loadingInstructions')}{' '}
                  <span className="text-[11px] normal-case font-normal tracking-normal opacity-70">
                    {t('results.loadingHint')}
                  </span>
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('results.col.num')}</TableHead>
                      <TableHead>{t('results.col.palletId')}</TableHead>
                      <TableHead>{t('results.col.name')}</TableHead>
                      <TableHead>{t('results.col.dimensions')}</TableHead>
                      <TableHead>{t('results.col.weight')}</TableHead>
                      <TableHead>{t('results.col.orientation')}</TableHead>
                      <TableHead>{t('results.col.position')}</TableHead>
                      <TableHead>{t('results.col.stackable')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPlacements.map((pl, si) => {
                      const color = colorMap.get(pl);
                      const isSelected =
                        selectedPallet?.truckIndex === ti &&
                        selectedPallet?.palletId === pl.pallet.id;
                      return (
                        <TableRow
                          key={pl.pallet.id}
                          data-pallet-id={pl.pallet.id}
                          className={`cursor-pointer rounded-md ${isSelected ? 'bg-primary/10 outline outline-1 outline-primary/30' : 'hover:bg-primary/5'}`}
                          onClick={() => handleRowClick(ti, pl.pallet.id)}
                        >
                          <TableCell>{si + 1}</TableCell>
                          <TableCell>
                            <span
                              className="inline-block px-2 py-0.5 border font-mono font-bold text-xs"
                              style={{
                                backgroundColor: `${color}22`,
                                borderColor: `${color}66`,
                                color,
                              }}
                            >
                              {pl.pallet.id}
                            </span>
                          </TableCell>
                          <TableCell>
                            {pl.pallet.label ? (
                              <span className="text-sm">{pl.pallet.label}</span>
                            ) : (
                              <span className="text-muted-foreground opacity-45">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {fmt(pl.pallet.length)}×{fmt(pl.pallet.width)}×{fmt(pl.pallet.height)}
                          </TableCell>
                          <TableCell>{fmt(pl.pallet.weight)} kg</TableCell>
                          <TableCell>
                            {pl.rotation === 90 ? (
                              <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5">
                                {t('results.rotated')}
                              </span>
                            ) : (
                              t('results.normal')
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {fmt(pl.x)}, {fmt(pl.y)}, {fmt(pl.z)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={pl.pallet.stackable ? 'default' : 'destructive'}>
                              {pl.pallet.stackable
                                ? t('pallets.stackable.yes')
                                : t('pallets.stackable.no')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 border-l border-border min-h-[420px] flex flex-col">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2.5">
                  {t('results.vis3d')}{' '}
                  <span className="text-[11px] normal-case font-normal tracking-normal opacity-70">
                    {t('results.visHint')}
                  </span>
                </h4>
                <Visualizer
                  ref={(ref) => {
                    if (ref) {
                      visualizerRefs.current.set(ti, ref);
                    } else {
                      visualizerRefs.current.delete(ti);
                    }
                  }}
                  truck={truck}
                  containerId={visId}
                  selectedPalletId={
                    selectedPallet?.truckIndex === ti
                      ? selectedPallet.palletId
                      : null
                  }
                  onSelectPallet={(palletId) => handleSelectPallet(ti, palletId)}
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
