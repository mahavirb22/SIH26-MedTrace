import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import RiskBadge from '../../components/RiskBadge';
import BatchBadge from '../../components/BatchBadge';

export default function RegulatorOverview() {
  const { authFetch } = useAuth();
  const [metrics, setMetrics] = useState({});
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      setLoading(true);
      try {
        const [overRes, anomRes] = await Promise.all([
          authFetch('/api/admin/overview'),
          authFetch('/api/admin/anomalies?resolved=false'),
        ]);
        const overData = await overRes.json();
        const anomData = await anomRes.json();

        if (overRes.ok) setMetrics(overData.metrics || {});
        if (anomRes.ok) setAnomalies((anomData.anomalies || []).slice(0, 5));
      } catch {
        // Use empty defaults
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  const metricCards = [
    { label: 'Verified Ledger Entries', value: metrics.totalVerifiedLedgers || 0, icon: 'verified', color: 'text-primary' },
    { label: 'Active Stores', value: metrics.activeRegisteredStores || 0, icon: 'storefront', color: 'text-primary' },
    { label: 'Flagged Diversions', value: metrics.flaggedDiversions || 0, icon: 'warning', color: 'text-error' },
    { label: 'Chain Compliance', value: `${metrics.chainComplianceRate || 100}%`, icon: 'shield', color: 'text-primary' },
  ];

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex">
      <Sidebar portal="admin" />

      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto flex flex-col gap-8">
        <div className="border-b border-outline-variant/20 pb-6">
          <h1 className="font-headline text-3xl font-bold text-primary">Regulator Overview</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">National pharmaceutical supply chain integrity dashboard.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {metricCards.map((m, idx) => (
                <Card key={idx} variant="outlined" rounded="xl" className="p-6 hover:shadow-level-2 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-label-caps text-xs text-outline uppercase tracking-wider font-bold">{m.label}</span>
                    <span className={`material-symbols-outlined text-2xl ${m.color}`}>{m.icon}</span>
                  </div>
                  <span className="font-headline text-4xl font-bold text-primary block">{m.value}</span>
                </Card>
              ))}
            </div>

            {/* Critical Anomalies */}
            <Card variant="outlined" rounded="xl" className="p-6">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-4">
                <h3 className="font-headline text-lg font-bold text-primary">Active Anomaly Alerts</h3>
                <Link to="/admin/alerts" className="text-xs text-primary font-bold hover:underline">View All →</Link>
              </div>

              {anomalies.length > 0 ? (
                <div className="space-y-4">
                  {anomalies.map((a, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
                      <div className="flex items-center gap-4">
                        <RiskBadge level={a.riskLevel} />
                        <div>
                          <p className="font-body text-sm font-semibold text-on-surface">{a.title}</p>
                          <p className="font-body text-xs text-outline mt-0.5">{a.description?.substring(0, 80)}...</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <BatchBadge id={a.batchId} />
                        <Link to={`/admin/audit/${a.batchId}`}>
                          <Button variant="ghost" size="sm">Audit</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-outline text-center py-8">No active anomalies. All clear.</p>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
