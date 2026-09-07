import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import BatchBadge from '../../components/BatchBadge';

export default function Dashboard() {
  const { authFetch } = useAuth();
  const [metrics, setMetrics] = useState({ todayScans: 0, todayDispensed: 0, flaggedAnomalies: 0, lowStockItems: 0 });
  const [store, setStore] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        const [dashRes, txRes] = await Promise.all([
          authFetch('/api/pharmacist/dashboard'),
          authFetch('/api/pharmacist/transactions'),
        ]);
        const dashData = await dashRes.json();
        const txData = await txRes.json();

        if (dashRes.ok) {
          setMetrics(dashData.metrics || {});
          setStore(dashData.store || null);
        }
        if (txRes.ok) {
          setTransactions(txData.transactions || []);
        }
      } catch {
        // Keep defaults on error
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const metricCards = [
    { label: "Today's Scans", value: String(metrics.todayScans || 0), icon: 'qr_code_scanner' },
    { label: 'Verified Dispensed', value: String(metrics.todayDispensed || 0), icon: 'verified' },
    { label: 'Flagged Anomalies', value: String(metrics.flaggedAnomalies || 0), icon: 'warning' },
    { label: 'Stock Items Low', value: String(metrics.lowStockItems || 0), icon: 'inventory_2' },
  ];

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex">
      <Sidebar portal="pharmacist" />

      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto flex flex-col gap-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">Pharmacist Dashboard</h1>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Dispensary status: <strong>{store ? `${store.name} (#${store.licenseId})` : 'Loading...'}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/pharmacist/sell">
              <Button variant="secondary" size="md" icon={<span className="material-symbols-outlined">point_of_sale</span>}>
                New Dispense
              </Button>
            </Link>
            <Link to="/pharmacist/inventory">
              <Button variant="outline" size="md" icon={<span className="material-symbols-outlined">add_box</span>}>
                Update Inventory
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {metricCards.map((m, idx) => (
                <Card key={idx} variant="outlined" rounded="xl" className="p-6 hover:shadow-level-2 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-label-caps text-xs text-outline uppercase tracking-wider font-bold">{m.label}</span>
                    <span className="material-symbols-outlined text-2xl text-primary">{m.icon}</span>
                  </div>
                  <span className="font-headline text-4xl font-bold text-primary block mb-1">{m.value}</span>
                </Card>
              ))}
            </div>

            {/* Recent Transactions */}
            <Card variant="outlined" rounded="xl" className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <h3 className="font-headline text-lg font-bold text-primary">Recent Dispensary Activity</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-[11px] font-label-caps text-outline uppercase tracking-wider">
                      <th className="pb-3 px-2">Batch ID</th>
                      <th className="pb-3 px-2">Event</th>
                      <th className="pb-3 px-2">Quantity</th>
                      <th className="pb-3 px-2">Timestamp</th>
                      <th className="pb-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-sm font-body">
                    {transactions.length > 0 ? transactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-2"><BatchBadge id={tx.batchId} /></td>
                        <td className="py-4 px-2">
                          <StatusBadge status={tx.event === 'SOLD' ? 'verified' : 'info'} label={tx.event} />
                        </td>
                        <td className="py-4 px-2 font-mono text-on-surface-variant">
                          {Math.abs(tx.payload?.quantityChanged || 0)} units
                        </td>
                        <td className="py-4 px-2 text-xs text-outline">
                          {new Date(tx.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <Link to={`/admin/audit/${tx.batchId}`}>
                            <Button variant="ghost" size="sm">Audit Trail</Button>
                          </Link>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-outline text-sm">No transactions yet today.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
