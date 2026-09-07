import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import RiskBadge from '../../components/RiskBadge';
import BatchBadge from '../../components/BatchBadge';

export default function AnomalyAlerts() {
  const { authFetch } = useAuth();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, high, medium, low

  useEffect(() => {
    fetchAnomalies();
  }, [filter]);

  async function fetchAnomalies() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('risk', filter);
      params.set('resolved', 'false');

      const res = await authFetch(`/api/admin/anomalies?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setAnomalies(data.anomalies || []);
    } catch {
      // Keep empty
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(id) {
    try {
      const res = await authFetch(`/api/admin/anomalies/${id}/resolve`, { method: 'PATCH' });
      if (res.ok) {
        setAnomalies((prev) => prev.filter((a) => a._id !== id));
      }
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex">
      <Sidebar portal="admin" />

      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">Anomaly Alerts</h1>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Flagged supply chain irregularities requiring investigation.
            </p>
          </div>
          <div className="flex bg-surface-container rounded-xl p-1 gap-1">
            {['all', 'high', 'medium', 'low'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-label-caps uppercase tracking-wider font-bold transition-all ${
                  filter === tab ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab === 'all' ? 'All Risks' : `${tab} Risk`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : anomalies.length > 0 ? (
          <div className="space-y-4">
            {anomalies.map((anomaly) => (
              <Card key={anomaly._id} variant="outlined" rounded="xl" className="p-6 hover:shadow-level-2 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <RiskBadge level={anomaly.riskLevel} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h3 className="font-headline text-base font-bold text-on-surface">{anomaly.title}</h3>
                        <span className="font-mono text-[10px] bg-surface-container px-2 py-0.5 rounded text-outline">{anomaly.type}</span>
                      </div>
                      <p className="font-body text-xs text-on-surface-variant">{anomaly.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-outline flex-wrap">
                        <span>Store: <strong>{anomaly.storeId?.name || anomaly.storeId?.licenseId || '—'}</strong></span>
                        <span>•</span>
                        <span>Detected: {new Date(anomaly.detectedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <BatchBadge id={anomaly.batchId} />
                    <Link to={`/admin/audit/${anomaly.batchId}`}>
                      <Button variant="outline" size="sm">Audit Trail</Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleResolve(anomaly._id)}>
                      ✓ Resolve
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="flat" rounded="xl" className="p-12 text-center text-outline">
            <span className="material-symbols-outlined text-4xl mb-2 block">verified_user</span>
            <p className="font-body text-sm">No active anomalies for the selected filter.</p>
          </Card>
        )}
      </main>
    </div>
  );
}
