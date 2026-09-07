import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import BatchBadge from '../../components/BatchBadge';
import BlisterDivider from '../../components/BlisterDivider';

export default function VerificationResult() {
  const { code } = useParams();
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifyData, setVerifyData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const verifyCode = code || 'BH-992-QX';

  // Fetch verification data from API
  useEffect(() => {
    async function fetchVerification() {
      setLoading(true);
      setError('');
      try {
        // Submit verification (creates scan record + ledger entry)
        const res = await fetch(`/api/verify/${encodeURIComponent(verifyCode)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Verification failed');
          setVerifyData({ verified: false, result: 'counterfeit' });
        } else {
          setVerifyData(data);
          // Also submit the verification event
          fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: verifyCode }),
          }).catch(() => {}); // fire and forget
        }
      } catch (err) {
        setError('Network error — is the backend running?');
        // Fall back to hardcoded data for demo if backend is down
        setVerifyData({
          verified: true,
          result: 'verified',
          batch: {
            batchId: verifyCode,
            product: { name: 'Amoxicillin 500mg', dosageForm: 'Oral Capsules', strength: '500mg', manufacturer: 'BioHealth Labs Ltd.' },
            mfgDate: '2024-01-12', expiryDate: '2025-12-31', status: 'active',
            currentHolder: { storeLicenseId: 'PHARM-8492' },
          },
          custodyChain: [],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchVerification();
  }, [verifyCode]);

  // Initialize AI chat greeting once data loads
  useEffect(() => {
    if (verifyData?.batch?.product) {
      const productName = verifyData.batch.product.name || 'this medication';
      setMessages([{
        sender: 'bot',
        text: `Hello! I am your AI Medication Assistant. I can answer questions about dosage, side effects, or interactions for ${productName} (Batch #${verifyData.batch.batchId}).`,
      }]);
    }
  }, [verifyData]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const suggestedQuestions = [
    'WHAT ARE COMMON SIDE EFFECTS?',
    'CAN I TAKE THIS WITH FOOD?',
    'IS THIS SAFE WITH ALCOHOL?',
  ];

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat/medication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          drugContext: {
            productName: verifyData?.batch?.product?.name,
            dosageForm: verifyData?.batch?.product?.dosageForm,
            strength: verifyData?.batch?.product?.strength,
            manufacturer: verifyData?.batch?.product?.manufacturer,
            batchId: verifyData?.batch?.batchId,
            expiryDate: verifyData?.batch?.expiryDate,
          },
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: 'bot', text: data.response || 'Sorry, I could not process that.' }]);
    } catch {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Connection error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Derive display values
  const batch = verifyData?.batch;
  const product = batch?.product || {};
  const isVerified = verifyData?.verified;
  const resultStatus = verifyData?.result === 'counterfeit' ? 'error' : verifyData?.result === 'warning' ? 'warning' : 'verified';
  const statusLabel = resultStatus === 'error' ? 'Counterfeit / Not Found' : resultStatus === 'warning' ? 'Warning — Expired' : 'Verified Authentic';
  const custodyChain = verifyData?.custodyChain || [];

  if (loading) {
    return (
      <div className="bg-surface font-body text-on-surface flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-24">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <p className="text-sm text-on-surface-variant">Verifying {verifyCode}...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body text-on-surface flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 w-full max-w-content mx-auto pt-24 pb-16 px-4 sm:px-8 flex flex-col gap-8">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <Link to="/patient/scan" className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-headline text-2xl font-bold text-primary">Scan Verification Result</h1>
          </div>
          <Link to="/patient/history">
            <Button variant="secondary" size="md">View My Medicines</Button>
          </Link>
        </div>

        {error && (
          <div className="bg-amber-500/10 text-amber-800 border border-amber-500/30 rounded-lg px-4 py-2 text-sm font-body">
            ⚠️ {error} — Showing cached/demo data.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Verification Card */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <Card variant="elevated" rounded="xl" className="p-8 flex flex-col items-center text-center relative overflow-hidden">
              {/* Status Icon */}
              <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full animate-pulse ${resultStatus === 'error' ? 'bg-error/20' : resultStatus === 'warning' ? 'bg-amber-500/20' : 'bg-secondary-container/20'}`}></div>
                <div className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-md ${resultStatus === 'error' ? 'bg-error-container' : resultStatus === 'warning' ? 'bg-amber-100' : 'bg-secondary-container'}`}>
                  <span className={`material-symbols-outlined text-5xl ${resultStatus === 'error' ? 'text-error' : resultStatus === 'warning' ? 'text-amber-700' : 'text-primary'}`}>
                    {resultStatus === 'error' ? 'dangerous' : resultStatus === 'warning' ? 'warning' : 'check_circle'}
                  </span>
                </div>
              </div>

              <StatusBadge status={resultStatus} label={statusLabel} className="mb-2 px-4 py-1 text-sm" />
              <p className="text-body text-sm text-outline mb-6">
                {resultStatus === 'error' ? 'This code was not found in the MedTrace ledger.' : 'Chain of custody & manufacturer hash confirmed in ledger.'}
              </p>

              {/* Medicine Product Specs */}
              {batch && (
                <div className="w-full bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 text-left flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-headline text-xl font-bold text-primary">{product.name || 'Unknown'}</h3>
                      <p className="font-body text-xs text-on-surface-variant">{product.dosageForm} {product.strength && `(${product.strength})`}</p>
                    </div>
                    <BatchBadge id={batch.batchId} />
                  </div>

                  <hr className="border-outline-variant/20 my-1" />

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-label-caps text-outline uppercase">Manufacturer</span>
                      <span className="font-body font-semibold text-on-surface">{product.manufacturer || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-label-caps text-outline uppercase">Mfg Date</span>
                      <span className="font-mono text-on-surface-variant">{batch.mfgDate ? new Date(batch.mfgDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }) : '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-label-caps text-outline uppercase">Expiry Date</span>
                      <span className="font-mono font-bold text-primary">{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }) : '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-label-caps text-outline uppercase">Dispensary</span>
                      <span className="font-body text-on-surface">{batch.currentHolder?.storeLicenseId || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Custody Chain Summary */}
              {custodyChain.length > 0 && (
                <div className="w-full mt-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-left">
                  <h4 className="font-label-caps text-xs text-outline uppercase mb-3">Custody Chain</h4>
                  <div className="space-y-2">
                    {custodyChain.map((entry, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${entry.event === 'MANUFACTURED' ? 'bg-primary' : entry.event === 'RECEIVED' ? 'bg-secondary' : entry.event === 'SOLD' ? 'bg-amber-500' : 'bg-outline'}`}></div>
                        <span className="font-mono text-outline w-24 shrink-0">{entry.event}</span>
                        <span className="text-on-surface-variant truncate">{entry.actor?.name || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="w-full mt-6 flex flex-col sm:flex-row gap-3">
                <Link to="/patient/history" className="w-full">
                  <Button variant="primary" size="md" fullWidth icon={<span className="material-symbols-outlined">bookmark_add</span>}>
                    Save to My Medicines
                  </Button>
                </Link>
                <Link to="/patient/scan" className="w-full">
                  <Button variant="outline" size="md" fullWidth>
                    Scan Another Medicine
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Right Column: AI Chat */}
          <div className="lg:col-span-6 flex flex-col">
            <Card variant="outlined" rounded="xl" className="flex-1 flex flex-col overflow-hidden min-h-[480px]">
              {/* Chat Header */}
              <div className="bg-surface-container-low px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">medical_services</span>
                  </div>
                  <div>
                    <h4 className="font-headline text-sm font-bold text-primary">MedTrace AI Medication Assistant</h4>
                    <p className="font-body text-[11px] text-outline">Instant guidance for {product.name || 'this medicine'}</p>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-secondary-container animate-ping"></span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-surface-container/30 max-h-[380px]">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex items-start gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${msg.sender === 'user' ? 'bg-secondary-container text-on-secondary-container font-bold' : 'bg-primary-container text-on-primary'}`}>
                      {msg.sender === 'user' ? 'You' : <span className="material-symbols-outlined text-xs">smart_toy</span>}
                    </div>
                    <div className={`p-3.5 rounded-2xl text-xs font-body leading-relaxed ${msg.sender === 'user' ? 'bg-primary-container text-on-primary rounded-tr-none' : 'bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded-tl-none shadow-sm'}`}>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 max-w-[80%]">
                    <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xs">smart_toy</span>
                    </div>
                    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-full px-4 py-2.5 flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:150ms]"></span>
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:300ms]"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Suggestions */}
              <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex flex-wrap gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button key={idx} onClick={() => handleSendMessage(q)} className="px-3 py-1 bg-surface-container-lowest border border-outline-variant/40 rounded-full text-[10px] font-label-caps font-bold text-primary hover:bg-secondary-container/40 transition-colors">
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/20">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about this medicine..."
                    className="w-full bg-surface-container/50 border border-outline-variant/30 rounded-full py-2.5 pl-4 pr-12 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
                  />
                  <button type="submit" disabled={!inputValue.trim()} className="absolute right-1.5 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary hover:bg-primary-container transition-colors disabled:opacity-40">
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </form>
              </div>
            </Card>
          </div>
        </div>

        <BlisterDivider count={18} />
      </main>
    </div>
  );
}
