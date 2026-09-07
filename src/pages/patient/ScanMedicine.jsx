import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';

export default function ScanMedicine() {
  const navigate = useNavigate();
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

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
      console.warn('Camera not available:', err.message);
      setCameraError('Camera access denied or not available. Use manual entry below.');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  // Simulate QR decode from camera (in production, integrate html5-qrcode or zxing-js)
  const handleCameraScan = () => {
    setIsScanning(true);
    // Simulate scan delay — in production this would be continuous QR detection
    setTimeout(() => {
      stopCamera();
      navigate('/verify/BH-992-QX');
    }, 1200);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setIsScanning(true);
      stopCamera();
      navigate(`/verify/${encodeURIComponent(manualCode.trim().toUpperCase())}`);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 relative w-full pt-20 pb-16 bg-black flex flex-col">
        <div className="flex flex-col w-full relative overflow-hidden flex-1 min-h-[calc(100vh-5rem)] justify-center items-center">
          {/* Live Camera Feed or Fallback */}
          <div className="absolute inset-0 z-0">
            {cameraError ? (
              <div className="w-full h-full bg-gradient-to-b from-primary/20 to-black/80 flex items-center justify-center">
                <p className="text-on-primary/60 text-sm font-body text-center px-8">{cameraError}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover opacity-60"
              />
            )}
          </div>
          <div className="absolute inset-0 z-0 bg-black/40 mix-blend-overlay"></div>

          {/* Scanner Overlay & Instructions */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full py-12 px-4 w-full max-w-md">
            {/* Top Prompt Banner */}
            <div className="text-center w-full">
              <p className="font-body text-sm text-on-secondary px-5 py-3 bg-inverse-surface/80 backdrop-blur-md rounded-full shadow-level-2 inline-block border border-outline-variant/20">
                Point camera at QR / Matrix code on medicine strip
              </p>
            </div>

            {/* Scanner Frame Window */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto my-auto cursor-pointer" onClick={handleCameraScan} title="Click to scan">
              {/* Corner Frame Lines */}
              <div className="absolute top-0 left-0 w-8 h-8 rounded-tl-2xl border-t-4 border-l-4 border-secondary-container"></div>
              <div className="absolute top-0 right-0 w-8 h-8 rounded-tr-2xl border-t-4 border-r-4 border-secondary-container"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 rounded-bl-2xl border-b-4 border-l-4 border-secondary-container"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-br-2xl border-b-4 border-r-4 border-secondary-container"></div>
              
              <div className="absolute inset-2 border border-outline-variant/30 rounded-xl bg-white/5 backdrop-blur-[2px]"></div>
              
              {/* Animated Scanline */}
              <div className={`absolute left-4 right-4 h-[2px] bg-secondary-container shadow-[0_0_12px_#c8f248] ${isScanning ? 'animate-ping' : 'animate-[scanline_3s_cubic-bezier(0.4,0,0.2,1)_infinite]'}`}></div>

              {/* Tap prompt */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/60 rounded-xl text-on-primary font-body text-xs font-bold uppercase tracking-wider">
                Tap to scan
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="w-full flex flex-col items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleCameraScan}
                disabled={isScanning}
                icon={<span className="material-symbols-outlined text-lg">qr_code_scanner</span>}
              >
                {isScanning ? 'Scanning Code...' : 'Scan Code'}
              </Button>

              <button
                onClick={() => setManualModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-inverse-surface/90 backdrop-blur-md rounded-full w-full max-w-xs transition-transform active:scale-95 shadow-level-2 text-on-secondary text-sm font-medium hover:bg-inverse-surface"
              >
                <span className="material-symbols-outlined text-secondary-container text-lg">keyboard</span>
                <span>Enter code manually</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Manual Code Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 w-full max-w-md shadow-xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-lg font-bold text-primary">Enter Serial Code Manually</h3>
              <button onClick={() => setManualModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="font-body text-xs text-on-surface-variant">
              Type the batch ID or micro-code printed on the medicine pack.
            </p>
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
              <FormInput
                label="Batch / Micro-Code"
                placeholder="e.g. BH-992-QX or A3F8B21C"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                mono
                required
              />
              <div className="flex gap-3 justify-end mt-2">
                <Button variant="ghost" size="md" onClick={() => setManualModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit">
                  Verify Code
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scanline animation keyframe */}
      <style>{`
        @keyframes scanline {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
