import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import FormInput from '../../components/FormInput';
import DigitalTwinBlisterPack from '../../components/DigitalTwinBlisterPack';

export default function SellPOS() {
  const { authFetch } = useAuth();
  const [batchId, setBatchId] = useState('');
  const [batch, setBatch] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [recentSales, setRecentSales] = useState([]);

  // Step 1: Scan / Enter batch QR code or single tablet code
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!batchId.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    setBatch(null);

    const cleanInput = batchId.trim().toUpperCase();

    try {
      // First try fetching batch details via pharmacist API
      const res = await authFetch(`/api/pharmacist/batch/${encodeURIComponent(cleanInput)}`);
      const data = await res.json();
      if (res.ok && data.batch) {
        setBatch(data.batch);
      } else {
        // Fallback: verify endpoint
        const verifyRes = await fetch(`/api/verify/${encodeURIComponent(cleanInput)}`);
        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.batch) {
          setBatch(verifyData.batch);
        } else {
          setLookupError(data.error || verifyData.error || 'Pack or micro-code not found in inventory.');
        }
      }
    } catch {
      setLookupError('Network error — please check backend connection.');
    } finally {
      setLookupLoading(false);
    }
  };

  // Callback when pharmacist dispenses tablets directly from Digital Twin model
  const handleDispenseCut = async ({ batchId: targetBatchId, quantity, stripIndex, targetCode }) => {
    try {
      const res = await authFetch('/api/pharmacist/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: targetBatchId,
          quantity,
          stripIndex,
          targetCode,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || 'Dispense cut failed' };
      }

      if (data.batch) {
        setBatch(data.batch);
      }

      setRecentSales((prev) => [
        {
          batchId: targetBatchId,
          product: data.batch?.product?.name || batch?.product?.name,
          quantity,
          stripNumber: stripIndex !== undefined ? stripIndex + 1 : 1,
          dispensedCodes: data.dispensedMicroCodes || [],
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);

      return data;
    } catch (err) {
      return { error: 'Network error processing cut sale' };
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex">
      <Sidebar portal="pharmacist" />

      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="border-b border-outline-variant/20 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">Dispense POS & Digital Twin</h1>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Scan Master QR or single tablet micro-code to view live blister foil strips and cut sequential tablets.
            </p>
          </div>
        </div>

        {/* Scan / Lookup Input Bar */}
        <Card variant="outlined" rounded="xl" className="p-6">
          <h3 className="font-headline text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">qr_code_scanner</span>
            Scan Master Pack QR Code or Single Tablet Micro-Code
          </h3>
          <form onSubmit={handleLookup} className="flex gap-3">
            <div className="flex-1">
              <FormInput
                placeholder="Enter or scan Master Pack ID (e.g. BH-992-QX) or tablet code..."
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                mono
                required
              />
            </div>
            <Button variant="primary" size="md" type="submit" disabled={lookupLoading}>
              {lookupLoading ? 'Scanning...' : 'Open Digital Twin'}
            </Button>
          </form>
          {lookupError && (
            <div className="mt-3 bg-error-container/40 text-error border border-error/30 rounded-xl px-4 py-3 text-xs font-body flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{lookupError}</span>
            </div>
          )}
        </Card>

        {/* Digital Twin Model Display */}
        {batch ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DigitalTwinBlisterPack
                batch={batch}
                onDispenseCut={handleDispenseCut}
              />
            </div>

            {/* Session Sales Side Panel */}
            <div className="flex flex-col gap-6">
              <Card variant="outlined" rounded="xl" className="p-6">
                <h3 className="font-headline text-base font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl">history</span>
                  Session Cut Sales History
                </h3>
                {recentSales.length > 0 ? (
                  <div className="space-y-3">
                    {recentSales.map((sale, idx) => (
                      <div key={idx} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-1.5">
                        <div className="flex justify-between items-start">
                          <span className="font-body text-xs font-bold text-primary">{sale.product}</span>
                          <span className="text-[10px] text-outline">{sale.time}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-outline">Strip #{sale.stripNumber}</span>
                          <span className="font-bold text-error">✂️ Cut {sale.quantity} tab(s)</span>
                        </div>
                        {sale.dispensedCodes?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sale.dispensedCodes.map((c, i) => (
                              <span key={i} className="text-[9px] font-mono bg-secondary-container/30 text-primary px-1.5 py-0.5 rounded">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-outline text-center py-6">
                    No tablets cut in this session yet.
                  </p>
                )}
              </Card>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-low p-12 rounded-3xl border border-dashed border-outline-variant/40 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary-container/30 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">view_module</span>
            </div>
            <h3 className="font-headline text-lg font-bold text-primary">No Active Digital Twin Pack Selected</h3>
            <p className="text-xs text-outline max-w-md">
              Scan a Master QR code above (or enter Master Pack ID BH-992-QX) to load the interactive physical blister foil digital twin model.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

