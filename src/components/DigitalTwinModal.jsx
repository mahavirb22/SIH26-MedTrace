import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DigitalTwinBlisterPack from './DigitalTwinBlisterPack';

/**
 * Modal wrapper to display the Digital Twin Blister Pack Model.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Object} [props.batch] - Pre-loaded batch object
 * @param {string} [props.batchId] - Batch ID to fetch if batch object not pre-loaded
 * @param {boolean} [props.readOnly=false]
 * @param {Function} [props.onUpdate] - Callback when stock/digital twin is updated
 */
export default function DigitalTwinModal({ isOpen, onClose, batch: initialBatch, batchId, readOnly = false, onUpdate }) {
  const { authFetch } = useAuth();
  const [batch, setBatch] = useState(initialBatch || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialBatch) {
        setBatch(initialBatch);
      } else if (batchId) {
        fetchBatchDetails(batchId);
      }
    }
  }, [isOpen, initialBatch, batchId]);

  async function fetchBatchDetails(id) {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/pharmacist/batch/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (res.ok && data.batch) {
        setBatch(data.batch);
      } else {
        setError(data.error || 'Failed to load batch details');
      }
    } catch {
      setError('Network error loading Digital Twin');
    } finally {
      setLoading(false);
    }
  }

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
        return { error: data.error || 'Failed to dispense tablet(s)' };
      }

      if (data.batch) {
        setBatch(data.batch);
      }
      if (onUpdate) onUpdate(data);

      return data;
    } catch (err) {
      return { error: 'Network error executing cut sale' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col font-body max-h-[90vh]">
        {/* Header */}
        <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">view_module</span>
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-primary">Dispensary Digital Twin Model</h3>
              <p className="text-xs text-outline">Real-time Blister Foil Strip & Micro-Code Tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <span className="text-xs font-mono text-outline">Loading Digital Twin metadata...</span>
            </div>
          ) : error ? (
            <div className="bg-error-container/40 text-error p-4 rounded-2xl border border-error/30 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          ) : batch ? (
            <DigitalTwinBlisterPack
              batch={batch}
              onDispenseCut={handleDispenseCut}
              readOnly={readOnly}
            />
          ) : (
            <p className="text-center text-outline text-sm py-8">No Digital Twin batch metadata available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
