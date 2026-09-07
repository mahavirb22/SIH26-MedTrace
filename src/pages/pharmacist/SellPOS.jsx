import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import FormInput from '../../components/FormInput';
import StatusBadge from '../../components/StatusBadge';
import BatchBadge from '../../components/BatchBadge';

export default function SellPOS() {
  const { authFetch } = useAuth();
  const [batchId, setBatchId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [sellResult, setSellResult] = useState(null);
  const [recentSales, setRecentSales] = useState([]);

  // Step 1: Scan / Enter batch QR code
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!batchId.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);
    setSellResult(null);
    try {
      const res = await fetch(`/api/verify/${encodeURIComponent(batchId.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || 'Batch not found');
      } else {
        setLookupResult(data);
        setQuantity(1);
      }
    } catch {
      setLookupError('Network error — is the backend running?');
    } finally {
      setLookupLoading(false);
    }
  };

  // Step 2: Confirm dispense
  const handleSell = async () => {
    if (!lookupResult?.batch) return;
    setSellLoading(true);
    setSellResult(null);
    try {
      const res = await authFetch('/api/pharmacist/sell', {
        method: 'POST',
        body: JSON.stringify({
          batchId: lookupResult.batch.batchId,
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSellResult({ success: false, message: data.error || 'Sale failed' });
      } else {
        setSellResult({ success: true, message: data.message, dispensedCodes: data.dispensedMicroCodes || [] });
        setRecentSales((prev) => [
          { batchId: lookupResult.batch.batchId, product: lookupResult.batch.product?.name, quantity, time: new Date().toLocaleTimeString() },
          ...prev,
        ]);
        // Reset for next sale
        setLookupResult(null);
        setBatchId('');
      }
    } catch {
      setSellResult({ success: false, message: 'Network error' });
    } finally {
      setSellLoading(false);
    }
  };

  const batch = lookupResult?.batch;

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex">
      <Sidebar portal="pharmacist" />

      <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="border-b border-outline-variant/20 pb-6">
          <h1 className="font-headline text-3xl font-bold text-primary">Dispense Medicine</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Scan pack QR → Select quantity → Confirm dispense. Digital twin updates automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Scan & Lookup */}
          <div className="flex flex-col gap-6">
            <Card variant="outlined" rounded="xl" className="p-6">
              <h3 className="font-headline text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">qr_code_scanner</span>
                Step 1: Scan Pack
              </h3>
              <form onSubmit={handleLookup} className="flex gap-3">
                <div className="flex-1">
                  <FormInput
                    placeholder="Enter or scan Batch ID (e.g. BH-992-QX)"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    mono
                    required
                  />
                </div>
                <Button variant="primary" size="md" type="submit" disabled={lookupLoading}>
                  {lookupLoading ? 'Looking up...' : 'Lookup'}
                </Button>
              </form>
              {lookupError && (
                <div className="mt-3 bg-error-container/40 text-error border border-error/30 rounded-lg px-4 py-2 text-sm">
                  {lookupError}
                </div>
              )}
            </Card>

            {/* Batch Details */}
            {batch && (
              <Card variant="elevated" rounded="xl" className="p-6">
                <h3 className="font-headline text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">medication</span>
                  Step 2: Confirm Dispense
                </h3>

                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-headline text-lg font-bold text-primary">{batch.product?.name}</h4>
                      <p className="text-xs text-on-surface-variant">{batch.product?.dosageForm} • {batch.product?.manufacturer}</p>
                    </div>
                    <BatchBadge id={batch.batchId} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-outline uppercase">Available Stock</span>
                      <span className="font-mono text-lg font-bold text-primary">{batch.remainingUnits} <span className="text-xs text-outline font-normal">/ {batch.totalUnits}</span></span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-outline uppercase">Expiry</span>
                      <span className="font-mono font-semibold">{new Date(batch.expiryDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-outline uppercase">Status</span>
                      <StatusBadge status={batch.isExpired ? 'warning' : 'verified'} label={batch.isExpired ? 'Expired' : batch.status} />
                    </div>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mb-4">
                  <label className="font-label-caps text-xs text-outline uppercase font-bold">Quantity to Dispense:</label>
                  <div className="flex items-center border border-outline-variant/30 rounded-lg overflow-hidden">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 bg-surface-container hover:bg-surface-container-high text-primary font-bold">−</button>
                    <input
                      type="number"
                      min="1"
                      max={batch.remainingUnits}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(batch.remainingUnits, parseInt(e.target.value) || 1)))}
                      className="w-16 text-center font-mono text-lg font-bold border-x border-outline-variant/30 py-2 bg-transparent"
                    />
                    <button onClick={() => setQuantity(Math.min(batch.remainingUnits, quantity + 1))} className="px-3 py-2 bg-surface-container hover:bg-surface-container-high text-primary font-bold">+</button>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleSell}
                  disabled={sellLoading || batch.isExpired}
                  icon={<span className="material-symbols-outlined">verified</span>}
                >
                  {sellLoading ? 'Processing...' : `Confirm Dispense (${quantity} unit${quantity > 1 ? 's' : ''})`}
                </Button>

                {batch.isExpired && (
                  <p className="text-error text-xs mt-2 text-center font-bold">⚠️ Cannot dispense expired stock.</p>
                )}
              </Card>
            )}

            {/* Sale Result */}
            {sellResult && (
              <Card variant={sellResult.success ? 'elevated' : 'outlined'} rounded="xl" className="p-6">
                <div className={`flex items-center gap-3 ${sellResult.success ? 'text-primary' : 'text-error'}`}>
                  <span className="material-symbols-outlined text-3xl">{sellResult.success ? 'check_circle' : 'error'}</span>
                  <div>
                    <h4 className="font-headline text-lg font-bold">{sellResult.success ? 'Dispense Confirmed' : 'Dispense Failed'}</h4>
                    <p className="text-sm text-on-surface-variant">{sellResult.message}</p>
                  </div>
                </div>
                {sellResult.dispensedCodes?.length > 0 && (
                  <div className="mt-3 bg-surface-container-low p-3 rounded-lg">
                    <span className="font-label-caps text-xs text-outline uppercase">Dispensed Micro-Codes:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {sellResult.dispensedCodes.map((c, i) => (
                        <span key={i} className="font-mono text-xs bg-secondary-container/20 text-primary px-2 py-1 rounded">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right: Recent Sales this session */}
          <div>
            <Card variant="outlined" rounded="xl" className="p-6">
              <h3 className="font-headline text-lg font-bold text-primary mb-4">Session Sales</h3>
              {recentSales.length > 0 ? (
                <div className="space-y-3">
                  {recentSales.map((sale, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-outline-variant/15 last:border-0">
                      <div>
                        <p className="font-body text-sm font-semibold text-on-surface">{sale.product}</p>
                        <p className="font-mono text-xs text-outline">{sale.batchId} • {sale.quantity} unit(s)</p>
                      </div>
                      <span className="text-xs text-outline">{sale.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-outline text-center py-8">No sales in this session yet.</p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
