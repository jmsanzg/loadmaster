import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { t, fmt, fmtDec, getLang } from './i18n';
import type { PackingSolution } from './types';

type ScreenshotFn = (truckIndex: number) => string | null;

export async function generatePDF(
  results: PackingSolution,
  getScreenshot: ScreenshotFn
): Promise<void> {
  if (!results.trucks.length) {
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const _origText = doc.text.bind(doc) as typeof doc.text;
  (doc as any).text = function (...args: unknown[]) {
    (doc as any).internal.write('0 Tc 0 Tw');
    return (_origText as Function).apply(doc, args);
  };

  const PW = 210,
    PH = 297,
    M = 14;
  const CW = PW - 2 * M;

  const BLUE: [number, number, number] = [26, 86, 219];
  const LBLUE: [number, number, number] = [219, 234, 254];
  const TXT: [number, number, number] = [17, 24, 39];
  const SUB: [number, number, number] = [107, 114, 128];
  const BORDER: [number, number, number] = [229, 231, 235];
  const BGROW: [number, number, number] = [249, 250, 251];

  const now = new Date();
  const locale = getLang() === 'en' ? 'en-GB' : 'es-ES';
  const dateStr = now.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const totalLoaded = results.trucks.reduce(
    (s, tr) => s + tr.placements.length,
    0
  );

  function drawFooter(pageNum: number, totalPages: number) {
    doc.setPage(pageNum);
    doc.setDrawColor(...BORDER);
    doc.line(M, PH - 12, PW - M, PH - 12);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SUB);
    doc.text(t('pdf.footer') + ' — ' + dateStr, M, PH - 7);
    doc.text(
      t('pdf.page', { page: pageNum, total: totalPages }),
      PW - M,
      PH - 7,
      { align: 'right' }
    );
  }

  // Page 1 - Cover / Summary
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, PW, 30, 'F');

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(t('pdf.title'), M, 18);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(t('pdf.subtitle'), M, 25);
  doc.text(dateStr, PW - M, 25, { align: 'right' });

  let y = 40;

  const statItems = [
    { val: String(totalLoaded), lbl: t('pdf.loadedPallets') },
    { val: String(results.trucks.length), lbl: t('pdf.trucksNeeded') },
    { val: fmt(results.totalCost) + ' €', lbl: t('pdf.totalCost') },
  ];
  const SW = CW / 3 - 2;
  statItems.forEach((s, i) => {
    const sx = M + i * (SW + 3);
    doc.setFillColor(...LBLUE);
    doc.roundedRect(sx, y, SW, 20, 2, 2, 'F');
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLUE);
    doc.text(s.val, sx + SW / 2, y + 11, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SUB);
    doc.text(s.lbl, sx + SW / 2, y + 17, { align: 'center' });
  });
  y += 28;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [
      [
        t('pdf.col.num'),
        t('pdf.col.type'),
        t('pdf.col.dimensions'),
        t('pdf.col.cost'),
        t('pdf.col.pallets'),
        t('pdf.col.volume'),
        t('pdf.col.weight'),
      ],
    ],
    body: results.trucks.map((tr) => [
      t('pdf.truckPrefix') + ' ' + tr.id,
      tr.type.name,
      `${fmt(tr.type.depth)} x ${fmt(tr.type.width)} x ${fmt(tr.type.height)}`,
      fmt(tr.type.cost) + ' €',
      tr.placements.length,
      fmtDec(tr.volumeUtilization * 100, 1) + '%',
      fmtDec((tr.totalWeight / tr.type.maxWeight) * 100, 1) + '%',
    ]),
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: TXT },
    headStyles: {
      fillColor: BLUE,
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: BGROW },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 18 },
    },
  } as any);

  // Pages 2..N - Per truck
  for (let ti = 0; ti < results.trucks.length; ti++) {
    const truck = results.trucks[ti];
    doc.addPage();

    doc.setFillColor(...BLUE);
    doc.rect(0, 0, PW, 24, 'F');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(
      t('pdf.truckHeader', { id: truck.id, name: truck.type.name }),
      M,
      15
    );
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${fmt(truck.type.depth)} x ${fmt(truck.type.width)} x ${fmt(truck.type.height)} cm  |  ${t('pdf.maxLabel')} ${fmt(truck.type.maxWeight)} kg  |  ${fmt(truck.type.cost)} €`,
      PW - M,
      15,
      { align: 'right' }
    );

    const sortedPl = [...truck.placements].sort((a, b) => a.z - b.z);
    const normalLabel = t('pdf.normal');

    autoTable(doc, {
      startY: 32,
      margin: { left: M, right: M },
      head: [
        [
          t('pdf.col.num'),
          t('pdf.col.id'),
          t('pdf.col.name'),
          t('pdf.col.dimensions'),
          t('pdf.col.weightKg'),
          t('pdf.col.orientation'),
          t('pdf.col.position'),
        ],
      ],
      body: sortedPl.map((pl, si) => [
        si + 1,
        pl.pallet.id,
        pl.pallet.label || '—',
        `${fmt(pl.pallet.length)} x ${fmt(pl.pallet.width)} x ${fmt(pl.pallet.height)}`,
        fmt(pl.pallet.weight),
        pl.rotation === 90 ? t('pdf.rotated') : normalLabel,
        `${fmt(pl.x)}, ${fmt(pl.y)}, ${fmt(pl.z)}`,
      ]),
      styles: { fontSize: 8, cellPadding: 2.2, textColor: TXT },
      headStyles: {
        fillColor: BLUE,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: BGROW },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold', cellWidth: 9 },
        1: { fontStyle: 'bold', cellWidth: 15 },
        2: { cellWidth: 40 },
        4: { halign: 'right', cellWidth: 15 },
        5: { halign: 'center', cellWidth: 22 },
        6: { halign: 'right', cellWidth: 26 },
      },
      didParseCell(data) {
        if (
          data.section === 'body' &&
          data.column.index === 5 &&
          data.cell.raw !== normalLabel
        ) {
          data.cell.styles.textColor = BLUE;
        }
      },
    });

    const imgData = getScreenshot(ti);
    if (imgData) {
      try {
        const img = new Image();
        img.src = imgData;
        const ar = img.width / img.height || 1.8;
        const tableBottom = (doc as any).lastAutoTable.finalY + 6;
        const availH = PH - tableBottom - M - 14;

        if (availH >= 30) {
          let imgW = CW,
            imgH = CW / ar;
          if (imgH > availH - 4) {
            imgH = availH - 4;
            imgW = imgH * ar;
          }
          const imgX = M + (CW - imgW) / 2;
          doc.addImage(imgData, 'PNG', imgX, tableBottom, imgW, imgH);
        } else {
          doc.addPage();
          doc.setFillColor(...BLUE);
          doc.rect(0, 0, PW, 24, 'F');
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text(
            t('pdf.truckHeader', { id: truck.id, name: truck.type.name }),
            M,
            15
          );
          const maxH = PH - 30 - M - 14;
          let imgW = CW,
            imgH = CW / ar;
          if (imgH > maxH) {
            imgH = maxH;
            imgW = imgH * ar;
          }
          const imgX = M + (CW - imgW) / 2;
          doc.addImage(imgData, 'PNG', imgX, 30, imgW, imgH);
        }
      } catch (e) {
        console.warn('Screenshot failed for truck', ti, e);
      }
    }
  }

  // Unplaced pallets page
  if (results.unplaced.length) {
    doc.addPage();
    doc.setFillColor(180, 100, 0);
    doc.rect(0, 0, PW, 24, 'F');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(
      t('pdf.unplacedTitle', { count: results.unplaced.length }),
      M,
      15
    );
    autoTable(doc, {
      startY: 32,
      margin: { left: M, right: M },
      head: [
        [
          t('pdf.col.id'),
          t('pdf.col.name'),
          t('pdf.col.dimensions'),
          t('pdf.col.weightKg2'),
          t('pdf.col.stackable'),
        ],
      ],
      body: results.unplaced.map((p) => [
        p.id,
        p.label || '—',
        `${fmt(p.length)} x ${fmt(p.width)} x ${fmt(p.height)}`,
        fmt(p.weight),
        p.stackable ? t('pdf.stackableYes') : t('pdf.stackableNo'),
      ]),
      styles: { fontSize: 9, cellPadding: 2.8, textColor: TXT },
      headStyles: {
        fillColor: [180, 100, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: BGROW },
    });
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) drawFooter(p, total);

  const ts = now.toISOString().slice(0, 16).replace(/[T:]/g, '-');
  doc.save(`loadmaster_${ts}.pdf`);
}
