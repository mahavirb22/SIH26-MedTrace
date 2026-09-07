import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import Card from '../../components/Card';
import FormInput from '../../components/FormInput';

export default function StoreAnalytics() {
  const { authFetch, user } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    async function fetchStores() {
      setLoading(true);
      try {
        const res = await authFetch('/api/admin/stores');
        const data = await res.json();
        if (res.ok) setStores(data.stores || []);
      } catch {
        // Keep empty
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  const filteredStores = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.licenseId.toLowerCase().includes(search.toLowerCase()) ||
    s.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex">
      <Sidebar portal="admin" />

      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto flex flex-col gap-8">
        <div className="border-b border-outline-variant/20 pb-6">
          <h1 className="font-headline text-3xl font-bold text-primary">Store Analytics</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            {isAdmin ? 'National store compliance and scan volume overview.' : 'Your store performance metrics.'}
          </p>
        </div>

        <div className="w-full md:w-80">
          <FormInput
            placeholder="Search by store name, license, or region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<span className="material-symbols-outlined">search</span>}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <Card variant="outlined" rounded="xl" className="p-6 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 text-[11px] font-label-caps text-outline uppercase tracking-wider">
                  <th className="pb-3 px-2">Store Name</th>
                  <th className="pb-3 px-2">License ID</th>
                  <th className="pb-3 px-2">Region</th>
                  <th className="pb-3 px-2">Total Scans</th>
                  <th className="pb-3 px-2">Compliance</th>
                  <th className="pb-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-sm font-body">
                {filteredStores.length > 0 ? filteredStores.map((store, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-4 px-2 font-semibold text-primary">{store.name}</td>
                    <td className="py-4 px-2 font-mono text-xs text-on-surface-variant">{store.licenseId}</td>
                    <td className="py-4 px-2 text-on-surface-variant">{store.region}</td>
                    <td className="py-4 px-2 font-mono font-bold">{store.totalScans || 0}</td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${store.complianceScore >= 95 ? 'bg-primary' : store.complianceScore >= 80 ? 'bg-amber-500' : 'bg-error'}`} style={{ width: `${store.complianceScore}%` }}></div>
                        </div>
                        <span className="font-mono text-xs font-bold">{store.complianceScore}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${store.isActive ? 'bg-secondary-container/20 text-primary' : 'bg-error-container/40 text-error'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {store.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="py-8 text-center text-outline">No stores found.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </div>
  );
}
