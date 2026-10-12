import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import BatchBadge from './BatchBadge';
import StatusBadge from './StatusBadge';

/**
 * Interactive Digital Twin Blister Pack Model.
 * Renders realistic physical blister foil strips with sequential tablet cavities and red X cut marks.
 * Supports scanning single tablet micro-codes, cavity selection, strip cut validation, and staff cut instructions.
 *
 * @param {Object} props
 * @param {Object} props.batch - The full batch object containing microCodes array
 * @param {Function} [props.onDispenseCut] - Callback when pharmacist executes a cut sale
 * @param {boolean} [props.readOnly=false]
 */
export default function DigitalTwinBlisterPack({ batch: initialBatch, onDispenseCut, readOnly = false }) {
  const [batch, setBatch] = useState(initialBatch);
  const [selectedStripIndex, setSelectedStripIndex] = useState(0);
  const [cutQuantity, setCutQuantity] = useState(1);
  const [dispenseError, setDispenseError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCutInfo, setLastCutInfo] = useState(null);

  // Single micro-code search & cavity targeting state
  const [microSearch, setMicroSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [highlightedCode, setHighlightedCode] = useState(null);

  // Sync state if prop changes
  React.useEffect(() => {
    setBatch(initialBatch);
  }, [initialBatch]);

  if (!batch || !batch.microCodes) return null;

  const totalUnits = batch.totalUnits || batch.microCodes.length;
  const pillsPerStrip = 10;
  const totalStrips = Math.ceil(totalUnits / pillsPerStrip);

  // Group micro-codes by blister strip (10 pills per strip)
  const strips = [];
  for (let i = 0; i < totalStrips; i++) {
    const start = i * pillsPerStrip;
    const stripCodes = batch.microCodes.slice(start, start + pillsPerStrip);
    const intactCount = stripCodes.filter((mc) => !mc.isDispensed).length;
    strips.push({
      index: i,
      label: `Blister Strip #${i + 1}`,
      codes: stripCodes,
      intactCount,
      dispensedCount: stripCodes.length - intactCount,
    });
  }

  const currentStrip = strips[selectedStripIndex] || strips[0];

  // Lookup single tablet micro-code or cavity number
  const handleMicroSearchChange = (query) => {
    setMicroSearch(query);
    setDispenseError('');

    if (!query.trim()) {
      setSearchResult(null);
      setHighlightedCode(null);
      return;
    }

    const cleanQ = query.trim().toUpperCase();
    // Search by exact code, suffix micro-code, or numeric cavity index (1-based)
    const foundPill = batch.microCodes.find(
      (mc) =>
        mc.code === cleanQ ||
        mc.code.endsWith(`-${cleanQ}`) ||
        mc.code.includes(cleanQ) ||
        mc.index === parseInt(cleanQ, 10) - 1
    );

    if (foundPill) {
      const stripIdx = Math.floor(foundPill.index / 10);
      const cavityIdx = (foundPill.index % 10) + 1;
      setSelectedStripIndex(stripIdx);
      setHighlightedCode(foundPill.code);
      setSearchResult({
        found: true,
        stripIndex: stripIdx,
        cavityIndex: cavityIdx,
        code: foundPill.code,
        isDispensed: foundPill.isDispensed,
      });
    } else {
      setSearchResult({ found: false, query: cleanQ });
      setHighlightedCode(null);
    }
  };

  // Handle clicking a cavity bubble on the blister strip
  const handleCavityClick = (mc) => {
    setHighlightedCode(mc.code);
    setMicroSearch(mc.code);
    setSearchResult({
      found: true,
      stripIndex: selectedStripIndex,
      cavityIndex: (mc.index % 10) + 1,
      code: mc.code,
      isDispensed: mc.isDispensed,
    });
  };

  const handleDispenseSubmit = async (e) => {
    e.preventDefault();
    setDispenseError('');
    setLastCutInfo(null);

    const qty = parseInt(cutQuantity, 10) || 1;
    if (qty < 1) {
      setDispenseError('Quantity must be at least 1.');
      return;
    }

    // Strict Blister Strip Intact Count Validation
    if (currentStrip.intactCount < qty) {
      setDispenseError(
        `❌ Cannot dispense ${qty} tablet(s) from Blister Strip #${selectedStripIndex + 1}. Only ${currentStrip.intactCount} intact tablet(s) remain on this blister strip!`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (onDispenseCut) {
        const res = await onDispenseCut({
          batchId: batch.batchId,
          quantity: qty,
          stripIndex: selectedStripIndex,
          targetCode: highlightedCode,
        });

        if (res && res.error) {
          setDispenseError(res.error);
        } else {
          // If backend returned updated batch, update local digital twin state immediately!
          if (res?.batch) {
            setBatch(res.batch);
          } else {
            // Optimistic local digital twin update
            const updatedCodes = [...batch.microCodes];
            let cutCount = 0;
            const startIdx = selectedStripIndex * pillsPerStrip;
            const endIdx = startIdx + pillsPerStrip - 1;

            for (let i = startIdx; i <= endIdx; i++) {
              if (updatedCodes[i] && !updatedCodes[i].isDispensed && cutCount < qty) {
                updatedCodes[i] = { ...updatedCodes[i], isDispensed: true };
                cutCount++;
              }
            }
            setBatch((prev) => ({
              ...prev,
              remainingUnits: prev.remainingUnits - cutCount,
              microCodes: updatedCodes,
            }));
          }

          setLastCutInfo({
            stripNumber: selectedStripIndex + 1,
            qty,
            codes: res?.dispensedMicroCodes || [],
          });
          setCutQuantity(1);
          setHighlightedCode(null);
          setSearchResult(null);
          setMicroSearch('');
        }
      }
    } catch (err) {
      setDispenseError(err.message || 'Dispense failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="outlined" rounded="xl" className="p-6 flex flex-col gap-6 font-body bg-surface-container-lowest shadow-sm">
      {/* Pack Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-xl shadow-sm">
            <span className="material-symbols-outlined text-2xl">view_module</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline text-xl font-bold text-primary">{batch.product?.name}</h3>
              <BatchBadge id={batch.batchId} />
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-0.5">
              Digital Twin Blister Pack • Manufacturer: <strong>{batch.product?.manufacturer}</strong>
            </p>
          </div>
        </div>

        {/* Live Pack Tablet Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/30">
          <div className="flex flex-col text-center">
            <span className="text-[10px] text-outline font-label-caps uppercase font-bold">Total Pack</span>
            <span className="font-bold text-on-surface text-sm">{totalUnits}</span>
          </div>
          <div className="w-px h-6 bg-outline-variant/30"></div>
          <div className="flex flex-col text-center">
            <span className="text-[10px] text-outline font-label-caps uppercase font-bold text-primary">Intact (Active)</span>
            <span className="font-bold text-primary text-sm">{batch.remainingUnits}</span>
          </div>
          <div className="w-px h-6 bg-outline-variant/30"></div>
          <div className="flex flex-col text-center">
            <span className="text-[10px] text-outline font-label-caps uppercase font-bold text-error">Cut (Sold X)</span>
            <span className="font-bold text-error text-sm">{totalUnits - batch.remainingUnits}</span>
          </div>
        </div>
      </div>

      {/* Single Tablet Micro-Code Scan / Search Bar */}
      <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-label-caps text-outline uppercase font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">qr_code_scanner</span>
            Scan or Enter Single Tablet Micro-Code / Cavity #
          </label>
          {highlightedCode && (
            <button
              onClick={() => { setHighlightedCode(null); setSearchResult(null); setMicroSearch(''); }}
              className="text-[11px] text-outline hover:text-primary underline font-medium"
            >
              Clear Highlight
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={microSearch}
              onChange={(e) => handleMicroSearchChange(e.target.value)}
              placeholder="Scan or enter micro code (e.g., BH-992-QX-MC-003 or 3)"
              className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-4 py-2 text-sm font-mono font-bold text-primary focus:outline-none focus:border-primary pr-10"
            />
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-outline text-lg pointer-events-none">
              search
            </span>
          </div>
        </div>

        {/* Micro-code Lookup Result Feedback */}
        {searchResult && (
          <div className={`p-3 rounded-xl text-xs font-body border flex items-center justify-between ${
            searchResult.found
              ? 'bg-secondary-container/20 border-secondary-container text-primary'
              : 'bg-error-container/20 border-error/30 text-error'
          }`}>
            {searchResult.found ? (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">location_searching</span>
                <span>
                  <strong>Tablet Located!</strong> Code: <code className="font-mono bg-primary/10 px-1 py-0.5 rounded">{searchResult.code}</code> resides on <strong>Blister Strip #{searchResult.stripIndex + 1}</strong> (Cavity #{searchResult.cavityIndex}).
                  Status: <strong className={searchResult.isDispensed ? 'text-error' : 'text-primary'}>{searchResult.isDispensed ? 'DISPENSED (Cut X)' : 'INTACT'}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-error">warning</span>
                <span>No tablet matching micro-code "<strong>{searchResult.query}</strong>" found in this pack.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Blister Strip Selector Tabs */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-label-caps text-outline uppercase font-bold">Select Blister Strip Foil</label>
          <span className="text-xs text-outline font-medium">Click strip tab to switch visual strip</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {strips.map((s) => (
            <button
              key={s.index}
              type="button"
              onClick={() => { setSelectedStripIndex(s.index); setDispenseError(''); setLastCutInfo(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all border flex items-center gap-2 ${
                selectedStripIndex === s.index
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:border-primary'
              }`}
            >
              <span>Blister Strip #{s.index + 1}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                selectedStripIndex === s.index ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-high text-outline'
              }`}>
                {s.intactCount}/10 Left
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Physical Realistic Blister Foil Strip Rendering */}
      <div className="bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 p-6 rounded-2xl border-2 border-slate-300 shadow-inner flex flex-col gap-4 relative overflow-hidden">
        {/* Blister Strip Metallic Texture Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/60 via-transparent to-black/5 pointer-events-none"></div>

        <div className="flex items-center justify-between z-10">
          <span className="font-headline font-bold text-slate-800 text-sm tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-600 text-base">view_carousel</span>
            {currentStrip.label} (Tablets {currentStrip.index * 10 + 1} - {Math.min((currentStrip.index + 1) * 10, totalUnits)})
          </span>
          <span className="text-[11px] font-mono font-bold text-slate-700 bg-white/80 px-2.5 py-1 rounded-lg shadow-xs">
            {currentStrip.intactCount === 10 ? 'Full Intact Strip' : currentStrip.intactCount === 0 ? 'Fully Dispensed (All Cut)' : `${currentStrip.intactCount} Pills Remaining`}
          </span>
        </div>

        {/* Pill Cavities Grid (2 rows x 5 columns = 10 cavities per blister strip) */}
        <div className="grid grid-cols-5 gap-3 sm:gap-4 z-10 py-2">
          {currentStrip.codes.map((mc) => {
            const isCut = mc.isDispensed;
            const isTargeted = highlightedCode === mc.code;

            return (
              <div
                key={mc.code}
                onClick={() => handleCavityClick(mc)}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all border-2 cursor-pointer overflow-hidden select-none ${
                  isTargeted
                    ? 'bg-amber-100/90 border-amber-500 shadow-lg scale-105 ring-4 ring-amber-400/50'
                    : isCut
                    ? 'bg-red-50/80 border-red-300 shadow-inner'
                    : 'bg-white border-slate-300 shadow-md hover:border-primary hover:scale-105'
                }`}
                title={`Pill #${mc.index + 1} | Code: ${mc.code} | Status: ${isCut ? 'DISPENSED (Cut X)' : 'INTACT'}. Click to target this cavity.`}
              >
                {/* Pill Capsule Bubble Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                  isTargeted
                    ? 'bg-amber-500 text-white animate-bounce'
                    : isCut
                    ? 'bg-red-100 text-red-400'
                    : 'bg-primary-container/20 text-primary'
                }`}>
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M4.5 10.5C3.1 11.9 3.1 14.1 4.5 15.5l4 4c1.4 1.4 3.6 1.4 5 0l6-6c1.4-1.4 1.4-3.6 0-5l-4-4c-1.4-1.4-3.6-1.4-5 0l-6 6zm10.6-3.6c.6-.6 1.6-.6 2.2 0l2 2c.6.6.6 1.6 0 2.2L14 14.5l-4.2-4.2 5.3-5.4z" />
                  </svg>
                </div>

                <span className="font-mono text-[10px] font-bold mt-1 text-slate-700 leading-none">
                  #{mc.index + 1}
                </span>
                <span className="font-mono text-[9px] text-slate-500 truncate w-full text-center leading-none mt-0.5">
                  {mc.code.substring(0, 5)}
                </span>

                {/* Targeted Cavity Badge */}
                {isTargeted && (
                  <span className="absolute -top-1 bg-amber-500 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                    TARGET
                  </span>
                )}

                {/* RED CROSS MARK (X) OVER DISPENSED / CUT PILLS */}
                {isCut && (
                  <div className="absolute inset-0 bg-red-500/25 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 font-extrabold text-4xl sm:text-5xl drop-shadow-md select-none">
                      close
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Cut Instructions & Cut Action Form */}
      {!readOnly && (
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">content_cut</span>
              <h4 className="font-headline text-base font-bold text-primary">Dispense & Cut Tablets from Strip #{selectedStripIndex + 1}</h4>
            </div>

            {/* Quick Whole Strip Button */}
            {currentStrip.intactCount > 0 && (
              <button
                type="button"
                onClick={() => setCutQuantity(currentStrip.intactCount)}
                className="text-xs font-bold text-primary hover:text-primary-hover bg-primary-container/30 px-3 py-1 rounded-lg border border-primary/20 transition-all"
              >
                Select Whole Remaining Strip ({currentStrip.intactCount} tabs)
              </button>
            )}
          </div>

          {/* Cut Success Banner */}
          {lastCutInfo && (
            <div className="bg-secondary-container/20 text-primary border border-secondary-container/50 rounded-xl p-4 text-xs font-body flex items-start gap-3 animate-fadeIn">
              <span className="material-symbols-outlined text-xl text-primary shrink-0">content_cut</span>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">✂️ Staff Cutting Notice: Cut {lastCutInfo.qty} tablet(s) from Blister Strip #{lastCutInfo.stripNumber} for patient!</span>
                <span className="text-outline">Red cross marks (X) updated on the digital twin. Dispensed micro-codes: {lastCutInfo.codes.join(', ')}</span>
              </div>
            </div>
          )}

          {/* Validation Error Banner */}
          {dispenseError && (
            <div className="bg-error-container/40 text-error border border-error/30 rounded-xl p-3.5 text-xs font-body flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-error shrink-0">error</span>
              <span className="font-semibold">{dispenseError}</span>
            </div>
          )}

          <form onSubmit={handleDispenseSubmit} className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-label-caps text-outline uppercase font-bold block">
                  Number of Tablets to Cut & Sell
                </label>
                <span className="text-[11px] text-outline font-mono">
                  Strip #{selectedStripIndex + 1} Intact: <strong>{currentStrip.intactCount}</strong>
                </span>
              </div>
              <input
                type="number"
                min="1"
                max={currentStrip.intactCount || 1}
                value={cutQuantity}
                onChange={(e) => {
                  setCutQuantity(e.target.value);
                  setDispenseError('');
                }}
                disabled={currentStrip.intactCount === 0 || isSubmitting}
                className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-2.5 text-sm font-mono font-bold text-primary focus:outline-none focus:border-primary disabled:opacity-50"
                placeholder="e.g. 3"
              />
            </div>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={currentStrip.intactCount === 0 || isSubmitting || parseInt(cutQuantity, 10) > currentStrip.intactCount}
              icon={<span className="material-symbols-outlined text-sm">content_cut</span>}
              className="w-full sm:w-auto shrink-0"
            >
              {isSubmitting ? 'Applying Red X Cut...' : `Confirm & Cut ${cutQuantity} Tablet(s)`}
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}

