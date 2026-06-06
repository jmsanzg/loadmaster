// main.js - Application controller
(function () {
    'use strict';

    // ── Active visualizers (need disposal on re-render) ──────────────────
    let activeVisualizers = [];
    let lastResults       = null;
    let resultsState      = 'initial'; // 'initial' | 'stale' | 'loaded'

    // Short aliases
    const t      = (key, vars) => i18n.t(key, vars);
    const fmt    = n            => i18n.fmt(n);
    const fmtDec = (n, d)       => i18n.fmtDec(n, d);

    // ── Modal ─────────────────────────────────────────────────────────────
    const modal = {
        overlay: null, title: null, body: null, footer: null,

        init() {
            this.overlay = document.getElementById('modal-overlay');
            this.title   = document.getElementById('modal-title');
            this.body    = document.getElementById('modal-body');
            this.footer  = document.getElementById('modal-footer');
            document.getElementById('modal-close').addEventListener('click', () => this.close());

            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && !this.overlay.classList.contains('hidden')) {
                    const tag = document.activeElement && document.activeElement.tagName;
                    if (tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA') this.close();
                }
            });
        },

        open(title, bodyHTML, footerHTML = '') {
            this.title.textContent  = title;
            this.body.innerHTML     = bodyHTML;
            this.footer.innerHTML   = footerHTML;
            this.overlay.classList.remove('hidden');
            document.body.classList.add('modal-open');
            const first = this.body.querySelector('input,select,textarea');
            if (first) setTimeout(() => first.focus(), 80);
        },

        close() {
            this.overlay.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }
    };

    // ── Static translation applicator ─────────────────────────────────────
    function applyStaticTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = t(el.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
            el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
        });
        document.title        = 'LoadMaster';
        document.documentElement.lang = i18n.getLang();

        // Keep lang buttons in sync
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === i18n.getLang());
        });
    }

    // ── Tabs ──────────────────────────────────────────────────────────────
    function initTabs() {
        document.querySelectorAll('.tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
                if (btn.dataset.tab === 'results' && lastResults) {
                    setTimeout(() => activeVisualizers.forEach(v => v._resize()), 50);
                }
            });
        });
    }

    // ── Trucks ────────────────────────────────────────────────────────────
    function renderTrucks() {
        const trucks = TruckManager.load();
        const tbody  = document.getElementById('trucks-tbody');

        if (!trucks.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-row">${esc(t('trucks.empty'))} <button class="btn btn-outline" style="margin-left:12px" onclick="App.loadDefaultTrucks()">${esc(t('trucks.loadDefaults'))}</button></td></tr>`;
            return;
        }

        tbody.innerHTML = trucks.map(tr => `
        <tr data-id="${tr.id}">
          <td><strong>${esc(tr.name)}</strong></td>
          <td>${fmt(tr.depth)}</td>
          <td>${fmt(tr.width)}</td>
          <td>${fmt(tr.height)}</td>
          <td>${fmtDec(tr.width * tr.height * tr.depth / 1e6, 1)}</td>
          <td>${fmt(tr.maxWeight)}</td>
          <td>${fmt(tr.cost)}</td>
          <td>
            <button class="btn-icon" title="${esc(t('trucks.editBtn'))}" onclick="App.editTruck('${tr.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icon danger" title="${esc(t('trucks.deleteBtn'))}" onclick="App.deleteTruck('${tr.id}')"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`).join('');
    }

    function truckFormHTML(truck = {}) {
        const v = (field, def = '') => truck[field] !== undefined ? truck[field] : def;
        return `
        <div class="form-grid">
          <div class="form-group full">
            <label>${esc(t('trucks.form.name'))}</label>
            <input type="text" id="f-name" value="${esc(v('name', t('trucks.form.defaultName')))}" placeholder="${esc(t('trucks.form.namePlaceholder'))}">
          </div>
          <div class="form-group">
            <label>${esc(t('trucks.form.length'))}</label>
            <input type="number" id="f-depth" value="${v('depth', 1360)}" min="1" step="1">
          </div>
          <div class="form-group">
            <label>${esc(t('trucks.form.width'))}</label>
            <input type="number" id="f-width" value="${v('width', 240)}" min="1" step="1">
          </div>
          <div class="form-group">
            <label>${esc(t('trucks.form.height'))}</label>
            <input type="number" id="f-height" value="${v('height', 270)}" min="1" step="1">
          </div>
          <div class="form-group">
            <label>${esc(t('trucks.form.maxWeight'))}</label>
            <input type="number" id="f-maxWeight" value="${v('maxWeight', 24000)}" min="1" step="1">
          </div>
          <div class="form-group">
            <label>${esc(t('trucks.form.cost'))}</label>
            <input type="number" id="f-cost" value="${v('cost', 0)}" min="0" step="1">
          </div>
        </div>`;
    }

    function readTruckForm() {
        return {
            name:      document.getElementById('f-name').value.trim(),
            width:     parseFloat(document.getElementById('f-width').value)     || 0,
            height:    parseFloat(document.getElementById('f-height').value)    || 0,
            depth:     parseFloat(document.getElementById('f-depth').value)     || 0,
            maxWeight: parseFloat(document.getElementById('f-maxWeight').value) || 0,
            cost:      parseFloat(document.getElementById('f-cost').value)      || 0
        };
    }

    function validateTruck(tr) {
        if (!tr.name)       return t('trucks.validation.nameRequired');
        if (tr.width  <= 0) return t('trucks.validation.widthRequired');
        if (tr.height <= 0) return t('trucks.validation.heightRequired');
        if (tr.depth  <= 0) return t('trucks.validation.lengthRequired');
        if (tr.maxWeight <= 0) return t('trucks.validation.maxWeightRequired');
        return null;
    }

    // ── Pallets ───────────────────────────────────────────────────────────
    function renderPallets() {
        const pallets = PalletManager.load();
        const tbody   = document.getElementById('pallets-tbody');
        const totals  = PalletManager.getTotals();

        document.getElementById('pallets-summary').innerHTML = pallets.length
            ? `<span>${pallets.length} ${esc(t('pallets.summary.unit'))}</span><span>${fmtDec(totals.totalVolume, 2)} m³</span><span>${fmt(totals.totalWeight)} kg</span>`
            : '';

        if (!pallets.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-row">${esc(t('pallets.empty'))}</td></tr>`;
            return;
        }

        tbody.innerHTML = pallets.map(p => `
        <tr data-pallet-id="${p.id}">
          <td><span class="pallet-id">${p.id}</span></td>
          <td class="pallet-label-cell">${p.label ? `<span class="pallet-label">${esc(p.label)}</span>` : '<span class="pallet-label-empty">—</span>'}</td>
          <td>${fmt(p.length)}</td><td>${fmt(p.width)}</td><td>${fmt(p.height)}</td>
          <td>${fmt(p.weight)}</td>
          <td><span class="badge ${p.stackable ? 'badge-yes' : 'badge-no'}">${p.stackable ? esc(t('pallets.stackable.yes')) : esc(t('pallets.stackable.no'))}</span></td>
          <td>
            <button class="btn-icon" onclick="App.editPallet('${p.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icon danger" onclick="App.deletePallet('${p.id}')"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`).join('');
    }

    function palletFormHTML(pallet = {}) {
        const v    = (f, def) => pallet[f] !== undefined ? pallet[f] : def;
        const isNew = !pallet.id;
        return `
        <div class="form-grid">
          <div class="form-group full">
            <label>${esc(t('pallets.form.label'))} <span style="font-weight:400;color:var(--text-muted)">${esc(t('pallets.form.labelOptional'))}</span></label>
            <input type="text" id="f-label" value="${esc(v('label', ''))}" placeholder="${esc(t('pallets.form.labelPlaceholder'))}" maxlength="60">
          </div>
          <div class="form-group">
            <label>${esc(t('pallets.form.length'))}</label>
            <input type="number" id="f-length" value="${v('length', 120)}" min="1" step="1">
          </div>
          <div class="form-group">
            <label>${esc(t('pallets.form.width'))}</label>
            <input type="number" id="f-width" value="${v('width', 80)}" min="1" step="1">
          </div>
          <div class="form-group">
            <label>${esc(t('pallets.form.height'))}</label>
            <input type="number" id="f-height" value="${v('height', 150)}" min="1" step="1">
          </div>
          <div class="form-group">
            <label>${esc(t('pallets.form.weight'))}</label>
            <input type="number" id="f-weight" value="${v('weight', 300)}" min="0" step="0.1">
          </div>
          ${isNew ? `
          <div class="form-group">
            <label>${esc(t('pallets.form.qty'))}</label>
            <input type="number" id="f-qty" value="1" min="1" max="500" step="1">
          </div>` : ''}
          <div class="form-group full">
            <label class="checkbox-label">
              <input type="checkbox" id="f-stackable" ${v('stackable', false) ? 'checked' : ''}>
              <span>${esc(t('pallets.form.stackable'))}</span>
            </label>
          </div>
        </div>`;
    }

    function readPalletForm() {
        return {
            label:     document.getElementById('f-label').value.trim(),
            length:    parseFloat(document.getElementById('f-length').value)   || 0,
            width:     parseFloat(document.getElementById('f-width').value)    || 0,
            height:    parseFloat(document.getElementById('f-height').value)   || 0,
            weight:    parseFloat(document.getElementById('f-weight').value)   || 0,
            stackable: document.getElementById('f-stackable').checked,
            qty:       parseInt(document.getElementById('f-qty')?.value || '1', 10) || 1
        };
    }

    function validatePallet(p) {
        if (p.length <= 0) return t('pallets.validation.lengthRequired');
        if (p.width  <= 0) return t('pallets.validation.widthRequired');
        if (p.height <= 0) return t('pallets.validation.heightRequired');
        if (p.weight <  0) return t('pallets.validation.weightNegative');
        return null;
    }

    // ── Clear results ─────────────────────────────────────────────────────
    function clearResults() {
        if (!lastResults) return;
        activeVisualizers.forEach(v => v.dispose());
        activeVisualizers = [];
        lastResults       = null;
        resultsState      = 'stale';
        document.getElementById('results-content').innerHTML = `<p class="empty-state">${esc(t('results.stale'))}</p>`;
    }

    // ── Optimize ──────────────────────────────────────────────────────────
    function runOptimization() {
        const pallets = PalletManager.load();
        const trucks  = TruckManager.load();

        if (!pallets.length) { alert(t('alert.noPallets')); return; }
        if (!trucks.length)  { alert(t('alert.noTrucks'));  return; }

        const btn  = document.getElementById('btn-optimize');
        const prog = document.getElementById('opt-progress');
        btn.disabled = true;
        prog.classList.remove('hidden');

        setTimeout(() => {
            try {
                const results = optimizeLoading(pallets, trucks);
                lastResults  = results;
                resultsState = 'loaded';
                renderResults(results);
                document.querySelector('.tab[data-tab="results"]').click();
            } catch (err) {
                alert(t('alert.optimizationError', { error: err.message }));
                console.error(err);
            } finally {
                btn.disabled = false;
                prog.classList.add('hidden');
            }
        }, 80);
    }

    // ── Results ───────────────────────────────────────────────────────────
    const TRUCK_COLORS_HEX = [
        '#FF6B6B','#4ECDC4','#45B7D1','#FFD93D','#96CEB4',
        '#C7F2A4','#FF8B94','#A8E6CF','#F8B400','#85C1E9',
        '#F7D794','#778CA3','#E77F67','#786FA6','#F8A5C2',
        '#63CDDA','#CF6A87','#574B90','#3DC1D3','#E15F41'
    ];

    function renderResults(results) {
        activeVisualizers.forEach(v => v.dispose());
        activeVisualizers = [];

        const container = document.getElementById('results-content');

        if (!results.trucks.length && !results.unplaced.length) {
            container.innerHTML = `<p class="empty-state">${esc(t('results.empty'))}</p>`;
            return;
        }

        let html = `
        <div class="results-toolbar">
          <button id="btn-download-pdf" class="btn btn-primary" onclick="App.downloadPDF()">
            <i class="fa-solid fa-download"></i>&nbsp; ${esc(t('results.downloadPdf'))}
          </button>
        </div>
        <div class="results-summary">
          <div class="summary-stat"><div class="stat-val">${results.trucks.reduce((s, tr) => s + tr.placements.length, 0)}</div><div class="stat-label">${esc(t('results.loaded'))}</div></div>
          <div class="summary-stat${results.unplaced.length ? ' warn' : ''}"><div class="stat-val">${results.unplaced.length}</div><div class="stat-label">${esc(t('results.unloaded'))}</div></div>
          <div class="summary-stat"><div class="stat-val">${results.trucks.length}</div><div class="stat-label">${esc(t('results.trucks'))}</div></div>
          <div class="summary-stat accent"><div class="stat-val">${fmt(results.totalCost)} €</div><div class="stat-label">${esc(t('results.totalCost'))}</div></div>
        </div>`;

        if (results.unplaced.length) {
            const badgeWord = results.unplaced.length !== 1
                ? t('results.unplacedBadgePlural')
                : t('results.unplacedBadge');
            html += `
            <div class="result-unplaced-card">
              <div class="result-unplaced-header">
                <div class="unplaced-header-text">
                  <div class="unplaced-subtitle">${esc(t('results.unplacedTitle'))}</div>
                </div>
                <div class="unplaced-count-badge">${results.unplaced.length} ${esc(badgeWord)}</div>
              </div>
              <div class="unplaced-body">
                <h4 class="unplaced-table-title">${esc(t('results.unplacedDetail'))} <span class="hint">${esc(t('results.unplacedHint'))}</span></h4>
                <table class="loading-table unplaced-table">
                  <thead>
                    <tr>
                      <th>${esc(t('results.col.num'))}</th><th>${esc(t('results.col.palletId'))}</th><th>${esc(t('results.col.name'))}</th><th>${esc(t('results.col.dimensions'))}</th>
                      <th>${esc(t('results.col.weight'))}</th><th>${esc(t('results.col.stackable'))}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${results.unplaced.map((p, i) => `<tr>
                      <td>${i + 1}</td>
                      <td><span class="pill-id pill-id-unplaced">${esc(p.id)}</span></td>
                      <td class="pallet-label-cell">${p.label ? `<span class="pallet-label">${esc(p.label)}</span>` : '<span class="pallet-label-empty">—</span>'}</td>
                      <td>${fmt(p.length)}×${fmt(p.width)}×${fmt(p.height)}</td>
                      <td>${fmt(p.weight)} kg</td>
                      <td><span class="badge ${p.stackable ? 'badge-yes' : 'badge-no'}">${p.stackable ? esc(t('pallets.stackable.yes')) : esc(t('pallets.stackable.no'))}</span></td>
                    </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>`;
        }

        results.trucks.forEach((truck, ti) => {
            const volPctVal = truck.volumeUtilization * 100;
            const wgtPctVal = (truck.totalWeight / truck.type.maxWeight) * 100;
            const volPct    = fmtDec(volPctVal, 1);
            const wgtPct    = fmtDec(wgtPctVal, 1);
            const colorMap  = new Map();
            truck.placements.forEach((pl, i) => colorMap.set(pl, TRUCK_COLORS_HEX[i % TRUCK_COLORS_HEX.length]));
            const sortedPlacements = [...truck.placements].sort((a, b) => a.z - b.z);
            const visId = `vis-truck-${ti}`;

            html += `
            <div class="result-truck-card">
              <div class="result-truck-header">
                <div class="truck-num">${esc(t('results.truckNum', { id: truck.id }))}</div>
                <div class="truck-type-name">${esc(truck.type.name)}</div>
                <div class="truck-meta">
                  ${fmt(truck.type.depth)}×${fmt(truck.type.width)}×${fmt(truck.type.height)} cm &nbsp;|&nbsp;
                  ${fmt(truck.type.cost)} € &nbsp;|&nbsp; ${truck.placements.length} ${esc(t('results.pallets'))}
                </div>
              </div>

              <div class="utilization-bars">
                <div class="util-bar-row">
                  <span class="util-label">${esc(t('results.volume'))}</span>
                  <div class="util-track"><div class="util-fill ${volPctVal > 90 ? 'over' : ''}" style="width:${Math.min(volPctVal, 100)}%"></div></div>
                  <span class="util-pct">${volPct}%</span>
                </div>
                <div class="util-bar-row">
                  <span class="util-label">${esc(t('results.weight'))}</span>
                  <div class="util-track"><div class="util-fill weight ${wgtPctVal > 90 ? 'over' : ''}" style="width:${Math.min(wgtPctVal, 100)}%"></div></div>
                  <span class="util-pct">${wgtPct}% (${fmt(truck.totalWeight)}/${fmt(truck.type.maxWeight)} kg)</span>
                </div>
              </div>

              <div class="result-body">
                <div class="loading-instructions">
                  <h4>${esc(t('results.loadingInstructions'))} <span class="hint">${esc(t('results.loadingHint'))}</span></h4>
                  <table class="loading-table">
                    <thead>
                      <tr>
                        <th>${esc(t('results.col.num'))}</th><th>${esc(t('results.col.palletId'))}</th><th>${esc(t('results.col.name'))}</th><th>${esc(t('results.col.dimensions'))}</th>
                        <th>${esc(t('results.col.weight'))}</th><th>${esc(t('results.col.orientation'))}</th><th>${esc(t('results.col.position'))}</th><th>${esc(t('results.col.stackable'))}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${sortedPlacements.map((pl, si) => {
                          const rotLabel = pl.rotation === 90 ? `<span class="rot-badge">${esc(t('results.rotated'))}</span>` : esc(t('results.normal'));
                          const color    = colorMap.get(pl);
                          return `<tr data-pallet-id="${pl.pallet.id}">
                            <td>${si + 1}</td>
                            <td><span class="pill-id" style="background:${color}22;border-color:${color}66;color:${color}">${pl.pallet.id}</span></td>
                            <td class="pallet-label-cell">${pl.pallet.label ? `<span class="pallet-label">${esc(pl.pallet.label)}</span>` : '<span class="pallet-label-empty">—</span>'}</td>
                            <td>${fmt(pl.pallet.length)}×${fmt(pl.pallet.width)}×${fmt(pl.pallet.height)}</td>
                            <td>${fmt(pl.pallet.weight)} kg</td>
                            <td>${rotLabel}</td>
                            <td class="pos-cell">${fmt(pl.x)}, ${fmt(pl.y)}, ${fmt(pl.z)}</td>
                            <td><span class="badge ${pl.pallet.stackable ? 'badge-yes' : 'badge-no'}">${pl.pallet.stackable ? esc(t('pallets.stackable.yes')) : esc(t('pallets.stackable.no'))}</span></td>
                          </tr>`;
                      }).join('')}
                    </tbody>
                  </table>
                </div>

                <div class="vis-panel">
                  <h4>${esc(t('results.vis3d'))} <span class="hint">${esc(t('results.visHint'))}</span></h4>
                  <div class="vis-container" id="${visId}"></div>
                </div>
              </div>
            </div>`;
        });

        container.innerHTML = html;

        requestAnimationFrame(() => {
            results.trucks.forEach((truck, ti) => {
                const vis = new TruckVisualizer(`vis-truck-${ti}`, truck);
                vis.init();
                activeVisualizers.push(vis);

                const card = document.getElementById(`vis-truck-${ti}`)?.closest('.result-truck-card');
                if (card) {
                    const rows = card.querySelectorAll('tr[data-pallet-id]');
                    rows.forEach(row => {
                        row.addEventListener('click', () => {
                            const alreadySelected = row.classList.contains('row-selected');
                            rows.forEach(r => r.classList.remove('row-selected'));
                            if (alreadySelected) {
                                vis.highlightPallet(null);
                            } else {
                                row.classList.add('row-selected');
                                vis.highlightPallet(row.dataset.palletId);
                            }
                        });
                    });
                }
            });
        });
    }

    // ── PDF Export ────────────────────────────────────────────────────────
    async function generatePDF() {
        if (!lastResults || !lastResults.trucks.length) {
            alert(t('alert.noResults'));
            return;
        }
        if (!window.jspdf) {
            alert(t('alert.jsPdfMissing'));
            return;
        }

        const btn = document.getElementById('btn-download-pdf');
        if (btn) { btn.disabled = true; btn.textContent = t('alert.generatingPdf'); }

        // Clear any pallet selection so screenshots show all pallets at full opacity
        activeVisualizers.forEach(v => v.highlightPallet(null));
        document.getElementById('results-content')?.querySelectorAll('tr.row-selected').forEach(r => r.classList.remove('row-selected'));

        try {
            const { jsPDF } = window.jspdf;
            const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Patch text() to reset char/word spacing before each call (avoids '&' artifacts)
            const _origText = doc.text.bind(doc);
            doc.text = function (...args) {
                doc.internal.write('0 Tc 0 Tw');
                return _origText(...args);
            };

            const PW  = 210, PH = 297, M = 14;
            const CW  = PW - 2 * M;

            const BLUE   = [26,  86,  219];
            const LBLUE  = [219, 234, 254];
            const GREEN  = [14,  159, 110];
            const ORANGE = [234, 130,   8];
            const RED    = [220,  38,  38];
            const TXT    = [17,  24,  39];
            const SUB    = [107, 114, 128];
            const BORDER = [229, 231, 235];
            const BGROW  = [249, 250, 251];

            const now     = new Date();
            const locale  = i18n.getLang() === 'en' ? 'en-GB' : 'es-ES';
            const dateStr = now.toLocaleDateString(locale, {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const totalLoaded = lastResults.trucks.reduce((s, tr) => s + tr.placements.length, 0);

            function drawFooter(pageNum, totalPages) {
                doc.setPage(pageNum);
                doc.setDrawColor(...BORDER);
                doc.line(M, PH - 12, PW - M, PH - 12);
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...SUB);
                doc.text(t('pdf.footer') + ' — ' + dateStr, M, PH - 7);
                doc.text(t('pdf.page', { page: pageNum, total: totalPages }), PW - M, PH - 7, { align: 'right' });
            }

            function sectionTitle(text, y) {
                doc.setFontSize(9.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...BLUE);
                doc.text(text.toUpperCase(), M, y);
                doc.setDrawColor(...BLUE);
                doc.line(M, y + 1.5, M + doc.getTextWidth(text.toUpperCase()), y + 1.5);
                doc.setTextColor(...TXT);
                return y + 7;
            }

            // PAGE 1 — Cover / Summary
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
                { val: String(totalLoaded),                     lbl: t('pdf.loadedPallets') },
                { val: String(lastResults.trucks.length),       lbl: t('pdf.trucksNeeded')  },
                { val: fmt(lastResults.totalCost) + ' €',       lbl: t('pdf.totalCost')     }
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

            doc.autoTable({
                startY: y,
                margin: { left: M, right: M },
                head: [[t('pdf.col.num'), t('pdf.col.type'), t('pdf.col.dimensions'), t('pdf.col.cost'), t('pdf.col.pallets'), t('pdf.col.volume'), t('pdf.col.weight')]],
                body: lastResults.trucks.map(tr => [
                    t('pdf.truckPrefix') + ' ' + tr.id,
                    tr.type.name,
                    `${fmt(tr.type.depth)} x ${fmt(tr.type.width)} x ${fmt(tr.type.height)}`,
                    fmt(tr.type.cost) + ' €',
                    tr.placements.length,
                    fmtDec(tr.volumeUtilization * 100, 1) + '%',
                    fmtDec((tr.totalWeight / tr.type.maxWeight) * 100, 1) + '%'
                ]),
                styles: { fontSize: 8.5, cellPadding: 2.5, textColor: TXT },
                headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: BGROW },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 18 },
                    3: { halign: 'right',   cellWidth: 24 },
                    4: { halign: 'center',  cellWidth: 16 },
                    5: { halign: 'center',  cellWidth: 18 },
                    6: { halign: 'center',  cellWidth: 18 }
                }
            });

            // PAGES 2..N — One page per truck
            for (let ti = 0; ti < lastResults.trucks.length; ti++) {
                const truck = lastResults.trucks[ti];
                doc.addPage();
                y = 0;

                doc.setFillColor(...BLUE);
                doc.rect(0, 0, PW, 24, 'F');
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(t('pdf.truckHeader', { id: truck.id, name: truck.type.name }), M, 15);
                doc.setFontSize(8.5);
                doc.setFont('helvetica', 'normal');
                doc.text(
                    `${fmt(truck.type.depth)} x ${fmt(truck.type.width)} x ${fmt(truck.type.height)} cm  |  ${t('pdf.maxLabel')} ${fmt(truck.type.maxWeight)} kg  |  ${fmt(truck.type.cost)} €`,
                    PW - M, 15, { align: 'right' }
                );
                y = 32;

                const sortedPl = [...truck.placements].sort((a, b) => a.z - b.z);
                const normalLabel = t('pdf.normal');
                doc.autoTable({
                    startY: y,
                    margin: { left: M, right: M },
                    head: [[t('pdf.col.num'), t('pdf.col.id'), t('pdf.col.name'), t('pdf.col.dimensions'), t('pdf.col.weightKg'), t('pdf.col.orientation'), t('pdf.col.position')]],
                    body: sortedPl.map((pl, si) => [
                        si + 1,
                        pl.pallet.id,
                        pl.pallet.label || '—',
                        `${fmt(pl.pallet.length)} x ${fmt(pl.pallet.width)} x ${fmt(pl.pallet.height)}`,
                        fmt(pl.pallet.weight),
                        pl.rotation === 90 ? t('pdf.rotated') : normalLabel,
                        `${fmt(pl.x)}, ${fmt(pl.y)}, ${fmt(pl.z)}`
                    ]),
                    styles: { fontSize: 8, cellPadding: 2.2, textColor: TXT },
                    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: BGROW },
                    columnStyles: {
                        0: { halign: 'center', fontStyle: 'bold', cellWidth: 9 },
                        1: { fontStyle: 'bold', cellWidth: 15 },
                        2: { cellWidth: 40 },
                        4: { halign: 'right',  cellWidth: 15 },
                        5: { halign: 'center', cellWidth: 22 },
                        6: { halign: 'right',  cellWidth: 26 }
                    },
                    didParseCell(data) {
                        if (data.section === 'body' && data.column.index === 5 && data.cell.raw !== normalLabel)
                            data.cell.styles.textColor = BLUE;
                    }
                });

                const viz = activeVisualizers[ti];
                if (viz) {
                    try {
                        const imgData = viz.getScreenshot();
                        const canvas  = viz.renderer.domElement;
                        const ar      = canvas.width / canvas.height;
                        const tableBottom = doc.lastAutoTable.finalY + 6;
                        const availH      = PH - tableBottom - M - 14;

                        if (availH >= 30) {
                            let imgW = CW, imgH = CW / ar;
                            if (imgH > availH - 4) { imgH = availH - 4; imgW = imgH * ar; }
                            const imgX = M + (CW - imgW) / 2;
                            doc.addImage(imgData, 'PNG', imgX, tableBottom, imgW, imgH);
                        } else {
                            doc.addPage();
                            doc.setFillColor(...BLUE);
                            doc.rect(0, 0, PW, 24, 'F');
                            doc.setFontSize(13);
                            doc.setFont('helvetica', 'bold');
                            doc.setTextColor(255, 255, 255);
                            doc.text(t('pdf.truckHeader', { id: truck.id, name: truck.type.name }), M, 15);
                            const maxH = PH - 30 - M - 14;
                            let imgW = CW, imgH = CW / ar;
                            if (imgH > maxH) { imgH = maxH; imgW = imgH * ar; }
                            const imgX = M + (CW - imgW) / 2;
                            doc.addImage(imgData, 'PNG', imgX, 30, imgW, imgH);
                        }
                    } catch (e) {
                        console.warn(t('pdf.col.num'), ti, e);
                    }
                }
            }

            // Optional page: unplaced pallets
            if (lastResults.unplaced.length) {
                doc.addPage();
                doc.setFillColor(180, 100, 0);
                doc.rect(0, 0, PW, 24, 'F');
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(t('pdf.unplacedTitle', { count: lastResults.unplaced.length }), M, 15);
                doc.autoTable({
                    startY: 32,
                    margin: { left: M, right: M },
                    head: [[t('pdf.col.id'), t('pdf.col.name'), t('pdf.col.dimensions'), t('pdf.col.weightKg2'), t('pdf.col.stackable')]],
                    body: lastResults.unplaced.map(p => [
                        p.id,
                        p.label || '—',
                        `${fmt(p.length)} x ${fmt(p.width)} x ${fmt(p.height)}`,
                        fmt(p.weight),
                        p.stackable ? t('pdf.stackableYes') : t('pdf.stackableNo')
                    ]),
                    styles: { fontSize: 9, cellPadding: 2.8, textColor: TXT },
                    headStyles: { fillColor: [180, 100, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: BGROW }
                });
            }

            const total = doc.getNumberOfPages();
            for (let p = 1; p <= total; p++) drawFooter(p, total);

            const ts = now.toISOString().slice(0, 16).replace(/[T:]/g, '-');
            doc.save(`loadmaster_${ts}.pdf`);

        } catch (err) {
            alert(t('alert.pdfError', { error: err.message }));
            console.error(err);
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-download"></i>&nbsp; ${esc(t('results.downloadPdf'))}`; }
        }
    }

    // ── Public API ────────────────────────────────────────────────────────
    const App = {
        addTruck() {
            modal.open(t('trucks.addTitle'), truckFormHTML(),
                `<button class="btn btn-primary" onclick="App._saveTruck()">${esc(t('modal.save'))}</button>
                 <button class="btn btn-outline" onclick="modal.close()">${esc(t('modal.cancel'))}</button>`);
        },

        editTruck(id) {
            const truck = TruckManager.load().find(tr => tr.id === id);
            if (!truck) return;
            modal.open(t('trucks.editTitle'), truckFormHTML(truck),
                `<button class="btn btn-primary" onclick="App._saveTruck('${id}')">${esc(t('modal.save'))}</button>
                 <button class="btn btn-outline" onclick="modal.close()">${esc(t('modal.cancel'))}</button>`);
        },

        _saveTruck(id) {
            const data = readTruckForm();
            const err  = validateTruck(data);
            if (err) { showError(err); return; }
            if (id) TruckManager.update(id, data);
            else    TruckManager.add(data);
            modal.close();
            clearResults();
            renderTrucks();
        },

        deleteTruck(id) {
            const truck = TruckManager.load().find(tr => tr.id === id);
            if (!truck) return;
            if (!confirm(t('confirm.deleteTruck', { name: truck.name }))) return;
            TruckManager.remove(id);
            clearResults();
            renderTrucks();
        },

        loadDefaultTrucks() {
            TruckManager.resetDefaults();
            clearResults();
            renderTrucks();
        },

        importTrucks() {
            const input  = document.createElement('input');
            input.type   = 'file';
            input.accept = '.json';
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                    try {
                        TruckManager.importJSON(ev.target.result);
                        clearResults();
                        renderTrucks();
                    } catch (err) {
                        alert(t('alert.importError', { error: err.message }));
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        },

        exportTrucks() {
            const json = TruckManager.exportJSON();
            downloadFile('loadmaster_camiones.json', json, 'application/json');
        },

        addPallet() {
            modal.open(t('pallets.addTitle'), palletFormHTML(),
                `<button class="btn btn-primary" onclick="App._savePallet()">${esc(t('modal.add'))}</button>
                 <button class="btn btn-outline" onclick="modal.close()">${esc(t('modal.cancel'))}</button>`);
        },

        editPallet(id) {
            const pallet = PalletManager.load().find(p => p.id === id);
            if (!pallet) return;
            modal.open(t('pallets.editTitle', { id }), palletFormHTML(pallet),
                `<button class="btn btn-primary" onclick="App._savePallet('${id}')">${esc(t('modal.save'))}</button>
                 <button class="btn btn-outline" onclick="modal.close()">${esc(t('modal.cancel'))}</button>`);
        },

        _savePallet(id) {
            const data = readPalletForm();
            const err  = validatePallet(data);
            if (err) { showError(err); return; }
            if (id) {
                PalletManager.update(id, data);
            } else {
                const { qty, ...palletData } = data;
                if (qty > 1) PalletManager.addBatch(palletData, qty);
                else         PalletManager.add(palletData);
            }
            modal.close();
            clearResults();
            renderPallets();
        },

        deletePallet(id) {
            if (!confirm(t('confirm.deletePallet', { id }))) return;
            PalletManager.remove(id);
            clearResults();
            renderPallets();
        },

        clearPallets() {
            if (!confirm(t('confirm.clearPallets'))) return;
            PalletManager.clearAll();
            clearResults();
            renderPallets();
        },

        setLanguage(lang) {
            i18n.setLang(lang);
            applyStaticTranslations();
            renderTrucks();
            renderPallets();
            if (lastResults) {
                renderResults(lastResults);
            } else if (resultsState === 'stale') {
                document.getElementById('results-content').innerHTML =
                    `<p class="empty-state">${esc(t('results.stale'))}</p>`;
            }
        },

        runOptimization,
        downloadPDF: generatePDF
    };

    window.App   = App;
    window.modal = modal;

    // ── Helpers ───────────────────────────────────────────────────────────
    function esc(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function showError(msg) {
        const existing = document.getElementById('form-error');
        if (existing) existing.remove();
        const el = document.createElement('div');
        el.id        = 'form-error';
        el.className = 'form-error';
        el.textContent = msg;
        document.getElementById('modal-body').prepend(el);
    }
    function downloadFile(name, content, type) {
        const blob = new Blob([content], { type });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── Boot ──────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        modal.init();
        initTabs();
        applyStaticTranslations();
        renderTrucks();
        renderPallets();

        document.getElementById('btn-add-truck').addEventListener('click',     () => App.addTruck());
        document.getElementById('btn-import-trucks').addEventListener('click', () => App.importTrucks());
        document.getElementById('btn-export-trucks').addEventListener('click', () => App.exportTrucks());
        document.getElementById('btn-add-pallet').addEventListener('click',    () => App.addPallet());
        document.getElementById('btn-clear-pallets').addEventListener('click', () => App.clearPallets());
        document.getElementById('btn-optimize').addEventListener('click',      () => App.runOptimization());
    });

})();
