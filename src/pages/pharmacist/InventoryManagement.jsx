import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import BatchBadge from '../../components/BatchBadge';
import FormInput from '../../components/FormInput';
import PharmacistMasterScannerModal from '../../components/PharmacistMasterScannerModal';
import DigitalTwinModal from '../../components/DigitalTwinModal';

export default function InventoryManagement() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [masterScannerOpen, setMasterScannerOpen] = useState(false);
  const [activeTwinBatch, setActiveTwinBatch] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    try {
      const res = await authFetch('/api/pharmacist/inventory');
      const data = await res.json();
      if (res.ok) {
        setItems(data.inventory || []);
      }
    } catch {
      // Keep empty
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = items.filter(
    (item) =>
      (item.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      item.batchId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex">
      <Sidebar portal="pharmacist" />

      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
          <div>
            <h1 className="font-headline text-3xl font-bold text-primary">Dispensary Inventory Management</h1>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Manage received pharmaceutical stock packs and monitor expiry / inventory levels.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setMasterScannerOpen(true)}
            icon={<span className="material-symbols-outlined">qr_code_scanner</span>}
          >
            Receive Stock (Scan Master Pack QR)
          </Button>
        </div>

        {/* Search */}
        <div className="w-full md:w-80">
          <FormInput
            placeholder="Search by Master Pack ID or medicine name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<span className="material-symbols-outlined">search</span>}
          />
        </div>

        {/* Inventory Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <Card variant="outlined" rounded="xl" className="p-6 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 text-[11px] font-label-caps text-outline uppercase tracking-wider">
                  <th className="pb-3 px-2">Master Pack ID</th>
                  <th className="pb-3 px-2">Medicine Details</th>
                  <th className="pb-3 px-2">Available / Total</th>
                  <th className="pb-3 px-2">Expiry Date</th>
                  <th className="pb-3 px-2">Stock Status</th>
                  <th className="pb-3 px-2 text-right">Digital Twin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-sm font-body">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, idx) => {
                    const isLow = item.remainingUnits < 20;
                    const isExpired = new Date(item.expiryDate) < new Date();
                    return (
                      <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-2"><BatchBadge id={item.batchId} /></td>
                        <td className="py-4 px-2">
                          <div>
                            <p className="font-semibold text-primary">{item.product?.name}</p>
                            <p className="text-xs text-outline">{item.product?.dosageForm}</p>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`font-mono font-bold ${isLow ? 'text-error' : 'text-primary'}`}>{item.remainingUnits}</span>
                          <span className="text-outline text-xs"> / {item.totalUnits} units</span>
                        </td>
                        <td className="py-4 px-2 font-mono text-xs">
                          {new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-2">
                          <StatusBadge status={isExpired ? 'error' : isLow ? 'warning' : 'verified'} label={isExpired ? 'Expired' : isLow ? 'Low Stock' : 'In Stock'} />
                        </td>
                        <td className="py-4 px-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<span className="material-symbols-outlined text-xs">view_module</span>}
                            onClick={() => setActiveTwinBatch(item)}
                          >
                            Digital Twin
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="6" className="py-8 text-center text-outline">No inventory items found. Click "Receive Stock" to scan a Master Pack.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        )}
      </main>

      {/* Pharmacist Master Pack QR Code Scanner Modal */}
      <PharmacistMasterScannerModal
        isOpen={masterScannerOpen}
        onClose={() => setMasterScannerOpen(false)}
        onSuccess={() => fetchInventory()}
      />

      {/* Digital Twin Modal */}
      {activeTwinBatch && (
        <DigitalTwinModal
          isOpen={Boolean(activeTwinBatch)}
          onClose={() => setActiveTwinBatch(null)}
          batch={activeTwinBatch}
          onUpdate={() => fetchInventory()}
        />
      )}
    </div>
  );
}

