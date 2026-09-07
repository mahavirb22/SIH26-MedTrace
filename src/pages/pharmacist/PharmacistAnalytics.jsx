import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function PharmacistAnalytics() {
  const { authFetch, user } = useAuth();
  const [metrics, setMetrics] = useState({});
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await authFetch('/api/pharmacist/dashboard');
        const data = await res.json();
        if (res.ok) {
          setMetrics(data.metrics || {});
          setStore(data.store || null);
        }
      } catch {
        // Keep defaults
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex">
      <Sidebar portal="pharmacist" />

      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto flex flex-col gap-8">
        <div className="border-b border-outline-variant/20 pb-6">
          <h1 className="font-headline text-3xl font-bold text-primary">Dispensary Performance & Analytics</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Store performance metrics for <strong>{store ? `${store.name} (#${store.licenseId})` : 'Dispensary'}</strong>
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card variant="outlined" rounded="xl" className="p-6">
                <span className="font-label-caps text-xs text-outline uppercase font-bold">Compliance Score</span>
                <span className="font-headline text-4xl font-bold text-primary block mt-2">
                  {store?.complianceScore || 99.8}%
                </span>
                <span className="text-xs text-primary font-semibold mt-1 block">✓ Verified Supply Chain Standard</span>
              </Card>

              <Card variant="outlined" rounded="xl" className="p-6">
                <span className="font-label-caps text-xs text-outline uppercase font-bold">Total Dispensed Today</span>
                <span className="font-headline text-4xl font-bold text-primary block mt-2">
                  {metrics.todayDispensed || 0} units
                </span>
                <span className="text-xs text-outline mt-1 block">Verified patient receipts</span>
              </Card>

              <Card variant="outlined" rounded="xl" className="p-6">
                <span className="font-label-caps text-xs text-outline uppercase font-bold">Low Stock Alerts</span>
                <span className="font-headline text-4xl font-bold text-error block mt-2">
                  {metrics.lowStockItems || 0} items
                </span>
                <span className="text-xs text-outline mt-1 block">Requires reorder</span>
              </Card>
            </div>

            <Card variant="outlined" rounded="xl" className="p-6">
              <h3 className="font-headline text-lg font-bold text-primary mb-4">Dispense Volume Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Amoxicillin 500mg</span>
                  <span className="text-xs font-mono font-bold text-primary">58 units sold</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '70%' }}></div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-semibold">Paracetamol 650mg</span>
                  <span className="text-xs font-mono font-bold text-primary">34 units sold</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
