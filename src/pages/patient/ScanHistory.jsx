import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import BatchBadge from '../../components/BatchBadge';
import FormInput from '../../components/FormInput';

export default function ScanHistory() {
  const { isAuthenticated, authFetch } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      if (!isAuthenticated) {
        // Show demo data if not logged in
        setHistoryItems(getDemoData());
        setLoading(false);
        return;
      }
      try {
        const res = await authFetch('/api/patient/history');
        const data = await res.json();
        if (res.ok && data.history) {
          setHistoryItems(data.history.map((scan) => ({
            id: scan.batchId,
            name: scan.product?.name || 'Unknown Medicine',
            dosage: scan.product?.dosageForm || '',
            date: new Date(scan.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            pharmacy: scan.currentHolder?.storeLicenseId || 'Unknown',
            status: scan.result === 'warning' ? 'warning' : scan.result === 'counterfeit' ? 'error' : 'verified',
          })));
        } else {
          setHistoryItems(getDemoData());
        }
      } catch {
        setHistoryItems(getDemoData());
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [isAuthenticated]);

  function getDemoData() {
    return [
      { id: 'BH-992-QX', name: 'Amoxicillin 500mg', dosage: 'Oral Capsules', date: 'Today, 2:45 PM', pharmacy: 'PHARM-8492', status: 'verified' },
      { id: 'LP-334-MX', name: 'Lipitor (Atorvastatin) 20mg', dosage: 'Film-Coated Tablets', date: 'Yesterday, 11:30 AM', pharmacy: 'PHARM-3310', status: 'verified' },
      { id: 'CR-882-FL', name: 'Crestor (Rosuvastatin) 10mg', dosage: 'Flagged - QR checksum discrepancy', date: 'Aug 24, 2026', pharmacy: 'Unverified Outpost', status: 'warning' },
      { id: 'PB-104-ZT', name: 'Paracetamol 650mg', dosage: 'Tablets', date: 'Aug 20, 2026', pharmacy: 'PHARM-1102', status: 'verified' },
    ];
  }

  const filteredItems = historyItems.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'verified') return matchesQuery && item.status === 'verified';
    if (filterTab === 'warning') return matchesQuery && (item.status === 'warning' || item.status === 'error');
    return matchesQuery;
  });

  return (
    <div className="bg-surface font-body text-on-surface flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-content mx-auto pt-24 pb-16 px-4 sm:px-8 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">My Medicines & Scan History</h1>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              {isAuthenticated ? 'Personal ledger of all scanned and verified pharmaceuticals.' : 'Sign in to persist your scan history across devices.'}
            </p>
          </div>
          <Link to="/patient/scan">
            <Button variant="secondary" size="md" icon={<span className="material-symbols-outlined">qr_code_scanner</span>}>
              Scan New Medicine
            </Button>
          </Link>
        </div>

        {!isAuthenticated && (
          <div className="bg-primary-fixed/30 text-primary border border-primary-fixed/50 rounded-lg px-4 py-3 text-sm font-body flex items-center gap-3">
            <span className="material-symbols-outlined">info</span>
            <span>Showing demo data. <Link to="/patient/login" className="underline font-bold">Sign in</Link> to see your real scan history.</span>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
          <div className="w-full md:w-80">
            <FormInput
              placeholder="Search by medicine name or batch ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<span className="material-symbols-outlined">search</span>}
            />
          </div>
          <div className="flex bg-surface-container rounded-xl p-1 gap-1 w-full md:w-auto">
            {['all', 'verified', 'warning'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-label-caps uppercase tracking-wider font-bold transition-all ${
                  filterTab === tab ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab === 'all' ? 'All Scans' : tab === 'verified' ? 'Verified Only' : 'Flagged / Warnings'}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <Card key={item.id + item.date} variant="outlined" rounded="xl" className="p-6 hover:shadow-level-2 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-container/10 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">medication</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-headline text-lg font-bold text-primary">{item.name}</h3>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="font-body text-xs text-on-surface-variant">{item.dosage}</p>
                        <div className="flex items-center gap-4 mt-2 text-[11px] text-outline flex-wrap">
                          <span>Dispensary: <strong>{item.pharmacy}</strong></span>
                          <span>•</span>
                          <span>Scanned: {item.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <BatchBadge id={item.id} />
                      <Link to={`/verify/${item.id}`}>
                        <Button variant="outline" size="sm">Details</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card variant="flat" rounded="xl" className="p-12 text-center text-outline">
                <p className="font-body text-sm">No medicine scans match your search query.</p>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
