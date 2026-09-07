import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import BatchBadge from '../../components/BatchBadge';
import FormInput from '../../components/FormInput';

export default function AuditTrail() {
  const { batchId: urlBatchId } = useParams();
  const { authFetch } = useAuth();
  const [batchId, setBatchId] = useState(urlBatchId || '');
  const [auditData, setAuditData] = useState(null);
  const [chainValid, setChainValid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlBatchId) {
      setBatchId(urlBatchId);
      fetchAudit(urlBatchId);
    }
  }, [urlBatchId]);

  async function fetchAudit(id) {
    const searchId = (id || batchId).toUpperCase().trim();
    if (!searchId) return;
    setLoading(true);
    setError('');
    setChainValid(null);
    try {
      const res = await authFetch(`/api/admin/audit/${encodeURIComponent(searchId)}`);
      const data = await res.json();
      if (res.ok) {
        setAuditData(data);
        // Also verify chain integrity
        const intRes = await authFetch(`/api/ledger/${encodeURIComponent(searchId)}/verify-integrity`);
        const intData = await intRes.json();
        if (intRes.ok) setChainValid(intData);
      } else {
        setError(data.error || 'Batch not found');
        setAuditData(null);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAudit(batchId);
  };

  const eventColors = {
    MANUFACTURED: 'bg-blue-500',
    SHIPPED: 'bg-indigo-500',
    RECEIVED: 'bg-primary',
    SOLD: 'bg-amber-500',
    VERIFIED: 'bg-secondary-container',
    RECALLED: 'bg-error',
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex">
      <Sidebar portal="admin" />

      <main className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto flex flex-col gap-8">
        <div className="border-b border-outline-variant/20 pb-6">
          <h1 className="font-headline text-3xl font-bold text-primary">Audit Trail</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Full cryptographic hash-chain custody trail for any pharmaceutical batch.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-3 items-end">
          <div className="flex-1 max-w-md">
            <FormInput
              label="Batch ID"
              placeholder="Enter Batch ID (e.g. BH-992-QX)"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              mono
              required
            />
          </div>
          <Button variant="primary" size="md" type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>

        {error && (
          <div className="bg-error-container/40 text-error border border-error/30 rounded-lg px-4 py-2 text-sm">{error}</div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        )}

        {auditData && !loading && (
          <>
            {/* Batch Summary */}
            {auditData.batch && (
              <Card variant="outlined" rounded="xl" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-headline text-xl font-bold text-primary">{auditData.batch.product?.name}</h3>
                    <p className="text-xs text-on-surface-variant">{auditData.batch.product?.dosageForm} • {auditData.batch.product?.manufacturer}</p>
                  </div>
                  <BatchBadge id={auditData.batch.batchId} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="font-label-caps text-outline uppercase">Total Units</span>
                    <p className="font-mono font-bold text-lg">{auditData.batch.totalUnits}</p>
                  </div>
                  <div>
                    <span className="font-label-caps text-outline uppercase">Remaining</span>
                    <p className="font-mono font-bold text-lg">{auditData.batch.remainingUnits}</p>
                  </div>
                  <div>
                    <span className="font-label-caps text-outline uppercase">Expiry</span>
                    <p className="font-mono font-semibold">{new Date(auditData.batch.expiryDate).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="font-label-caps text-outline uppercase">Chain Length</span>
                    <p className="font-mono font-bold text-lg">{auditData.chainLength} entries</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Chain Integrity Verification */}
            {chainValid && (
              <Card variant={chainValid.valid ? 'elevated' : 'outlined'} rounded="xl" className="p-4">
                <div className={`flex items-center gap-3 ${chainValid.valid ? 'text-primary' : 'text-error'}`}>
                  <span className="material-symbols-outlined text-2xl">{chainValid.valid ? 'verified' : 'gpp_bad'}</span>
                  <div>
                    <p className="font-body text-sm font-bold">{chainValid.valid ? 'Hash-Chain Integrity Verified ✓' : 'Chain Integrity Compromised!'}</p>
                    <p className="text-xs text-on-surface-variant">{chainValid.totalEntries} entries verified, {chainValid.errors || 0} errors</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Timeline */}
            <Card variant="outlined" rounded="xl" className="p-6">
              <h3 className="font-headline text-lg font-bold text-primary mb-6">Custody Timeline</h3>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-outline-variant/30"></div>

                <div className="space-y-6">
                  {auditData.auditTrail.map((entry, idx) => (
                    <div key={idx} className="relative flex items-start gap-6 pl-10">
                      {/* Timeline dot */}
                      <div className={`absolute left-2 top-1.5 w-5 h-5 rounded-full border-2 border-surface ${eventColors[entry.event] || 'bg-outline'} z-10`}></div>

                      <div className="flex-1 bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-primary-container/20 text-primary px-2 py-0.5 rounded font-bold">{entry.event}</span>
                            <span className="text-[11px] text-outline">Seq #{entry.sequenceNumber}</span>
                          </div>
                          <span className="text-[11px] text-outline">
                            {new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>

                        <p className="text-xs text-on-surface mb-1">
                          <strong>Actor:</strong> {entry.actor?.name || '—'} ({entry.actor?.role})
                        </p>

                        {entry.payload?.quantityChanged !== 0 && (
                          <p className="text-xs text-on-surface-variant">
                            Qty: <span className="font-mono font-bold">{entry.payload.quantityChanged > 0 ? '+' : ''}{entry.payload.quantityChanged}</span>
                            {entry.payload.remainingAfter != null && <span> → {entry.payload.remainingAfter} remaining</span>}
                          </p>
                        )}

                        <div className="mt-2 text-[10px] font-mono text-outline break-all">
                          Hash: {entry.currentHash?.substring(0, 24)}...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
