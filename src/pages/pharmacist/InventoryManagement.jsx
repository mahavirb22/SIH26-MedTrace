import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import BatchBadge from '../../components/BatchBadge';
import FormInput from '../../components/FormInput';

export default function InventoryManagement() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [receiveBatchId, setReceiveBatchId] = useState('');
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveResult, setReceiveResult] = useState(null);

  useEffect(() => { fetchInventory(); }, []);

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

  const handleReceiveStock = async (e) => {
    e.preventDefault();
    if (!receiveBatchId.trim()) return;
    setReceiveLoading(true);
    setReceiveResult(null);
    try {
      const res = await authFetch('/api/pharmacist/receive', {
        method: 'POST',
        body: JSON.stringify({ batchId: receiveBatchId.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setReceiveResult({ success: true, message: data.message });
        setReceiveBatchId('');
        setShowAddModal(false);
        fetchInventory(); // Refresh list
      } else {
        setReceiveResult({ success: false, message: data.error || 'Failed to receive stock' });
      }
    } catch {
      setReceiveResult({ success: false, message: 'Network error' });
    } finally {
      setReceiveLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
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
            <h1 className="font-headline text-3xl font-bold text-primary">Inventory Management</h1>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Manage received stock batches and track supply levels.
            </p>
          </div>
          <Button variant="secondary" size="md" onClick={() => setShowAddModal(true)} icon={<span className="material-symbols-outlined">add_box</span>}>
            Receive New Stock
          </Button>
        </div>

        {/* Result notification */}
        {receiveResult && (
          <div className={`${receiveResult.success ? 'bg-secondary-container/20 text-primary border-secondary-container/40' : 'bg-error-container/40 text-error border-error/30'} border rounded-lg px-4 py-3 text-sm flex items-center gap-2`}>
            <span className="material-symbols-outlined">{receiveResult.success ? 'check_circle' : 'error'}</span>
            {receiveResult.message}
          </div>
        )}

        {/* Search */}
        <div className="w-full md:w-80">
          <FormInput
            placeholder="Search by batch ID or medicine name..."
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
                  <th className="pb-3 px-2">Batch ID</th>
                  <th className="pb-3 px-2">Medicine</th>
                  <th className="pb-3 px-2">Stock / Total</th>
                  <th className="pb-3 px-2">Expiry</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-sm font-body">
                {filteredItems.length > 0 ? filteredItems.map((item, idx) => {
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
                        <span className="text-outline text-xs"> / {item.totalUnits}</span>
                      </td>
                      <td className="py-4 px-2 font-mono text-xs">
                        {new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-2">
                        <StatusBadge status={isExpired ? 'error' : isLow ? 'warning' : 'verified'} label={isExpired ? 'Expired' : isLow ? 'Low Stock' : 'In Stock'} />
                      </td>
                      <td className="py-4 px-2 text-xs text-outline">
                        {item.currentHolder?.receivedAt ? new Date(item.currentHolder.receivedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="6" className="py-8 text-center text-outline">No inventory items found.</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        )}
      </main>

      {/* Receive Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card variant="elevated" rounded="xl" className="p-8 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-xl font-bold text-primary">Receive New Stock Batch</h3>
              <button onClick={() => setShowAddModal(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="font-body text-xs text-on-surface-variant mb-4">
              Scan the batch QR code or enter the Batch ID. The one-way custody lock will verify this batch hasn't been received by another store.
            </p>
            <form onSubmit={handleReceiveStock} className="flex flex-col gap-4">
              <FormInput
                label="Batch ID"
                placeholder="e.g. BH-992-QX"
                value={receiveBatchId}
                onChange={(e) => setReceiveBatchId(e.target.value)}
                mono
                required
              />
              {receiveResult && !receiveResult.success && (
                <div className="bg-error-container/40 text-error border border-error/30 rounded-lg px-4 py-2 text-sm">
                  {receiveResult.message}
                </div>
              )}
              <div className="flex gap-3 justify-end mt-2">
                <Button variant="ghost" size="md" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button variant="primary" size="md" type="submit" disabled={receiveLoading}>
                  {receiveLoading ? 'Receiving...' : 'Receive Stock'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
