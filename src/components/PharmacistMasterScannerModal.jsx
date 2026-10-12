import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';
import FormInput from './FormInput';
import DigitalTwinModal from './DigitalTwinModal';

/**
 * Pharmacist Master Pack QR Code Scanner Modal.
 * Scans the Master QR Code on shipment boxes/packs to receive stock into dispensary inventory
 * and displays the initialized Digital Twin Model.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} [props.onSuccess]
 */
export default function PharmacistMasterScannerModal({ isOpen, onClose, onSuccess }) {
  const { authFetch } = useAuth();
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [digitalTwinOpen, setDigitalTwinOpen] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessData(null);
      setDigitalTwinOpen(false);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err.message);
      setCameraError('Camera unavailable. Use manual Pack ID entry below.');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  const handleReceiveStock = async (codeToSubmit) => {
    const packId = (codeToSubmit || manualCode).trim().toUpperCase();
    if (!packId) return;

    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await authFetch('/api/pharmacist/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: packId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to receive stock. Please verify Master Pack ID.');
      } else {
        setSuccessData(data);
        stopCamera();
        if (onSuccess) onSuccess(data);
      }
    } catch (err) {
      setErrorMsg('Network error — please verify server connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatedCameraScan = () => {
    handleReceiveStock('BH-992-QX');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col font-body">
          {/* Header */}
          <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">inventory_2</span>
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-primary">Scan Master Pack QR Code</h3>
                <p className="text-[11px] text-outline">Pharmacist Stock Receipt & Inventory Registration</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 flex flex-col gap-5">
            {/* Success Result View */}
            {successData ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-secondary-container text-primary flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="font-headline text-xl font-bold text-primary">Master Pack Successfully Received!</h4>
                  <p className="font-mono font-bold text-sm text-outline">Pack ID: {successData.batch?.batchId}</p>
                  <p className="font-body text-xs text-on-surface-variant mt-1">
                    <strong>{successData.batch?.product?.name}</strong> — {successData.batch?.totalUnits} units registered to your store inventory. Digital twin model generated.
                  </p>
                </div>
                <div className="w-full bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 text-left text-xs font-mono">
                  <span className="text-outline block">Ledger Hash:</span>
                  <span className="text-primary truncate block font-semibold">{successData.ledgerEntry?.currentHash}</span>
                </div>

                <div className="flex flex-col gap-2 w-full mt-2">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    icon={<span className="material-symbols-outlined text-base">view_module</span>}
                    onClick={() => setDigitalTwinOpen(true)}
                  >
                    View Interactive Digital Twin Model
                  </Button>
                  <Button variant="outline" size="md" fullWidth onClick={() => { setSuccessData(null); startCamera(); }}>
                    Scan Another Master Pack
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div className="bg-error-container/40 text-error border border-error/30 rounded-xl px-4 py-3 text-xs font-body flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-error shrink-0">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Camera Scanner Container */}
                <div className="relative w-full h-56 bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-outline-variant/30 group">
                  {cameraError ? (
                    <div className="text-center p-4 text-xs text-on-primary/60">{cameraError}</div>
                  ) : (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-70" />
                  )}

                  {/* Corner Frame & Scanline */}
                  <div className="absolute inset-4 border border-secondary-container/60 rounded-xl pointer-events-none"></div>
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-secondary-container rounded-tl"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-secondary-container rounded-tr"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-secondary-container rounded-bl"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-secondary-container rounded-br"></div>

                  <div className="absolute left-6 right-6 h-[2px] bg-secondary-container shadow-[0_0_8px_#c8f248] animate-pulse"></div>

                  <button
                    type="button"
                    onClick={handleSimulatedCameraScan}
                    disabled={isProcessing}
                    className="absolute bottom-3 bg-inverse-surface/80 hover:bg-inverse-surface text-on-secondary backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md"
                  >
                    {isProcessing ? 'Processing Master QR...' : 'Tap to Detect Master Pack QR'}
                  </button>
                </div>

                {/* Manual Entry Divider */}
                <div className="relative flex items-center justify-center my-1">
                  <span className="bg-surface-container-lowest px-3 text-[10px] text-outline font-label-caps uppercase">OR ENTER PACK ID MANUALLY</span>
                </div>

                {/* Manual Form */}
                <form onSubmit={(e) => { e.preventDefault(); handleReceiveStock(); }} className="flex flex-col gap-3">
                  <FormInput
                    label="Master Pack ID / Batch Code"
                    placeholder="e.g. BH-992-QX, LP-334-MX"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    mono
                    required
                  />
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={isProcessing || !manualCode.trim()}
                    icon={<span className="material-symbols-outlined text-sm">inventory</span>}
                  >
                    {isProcessing ? 'Receiving Stock...' : 'Receive & Register Pack'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Digital Twin Modal */}
      {successData && (
        <DigitalTwinModal
          isOpen={digitalTwinOpen}
          onClose={() => setDigitalTwinOpen(false)}
          batch={successData.batch}
        />
      )}
    </>
  );
}

