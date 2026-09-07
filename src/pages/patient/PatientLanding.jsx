import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import BlisterDivider from '../../components/BlisterDivider';
import Card from '../../components/Card';
import BatchBadge from '../../components/BatchBadge';
import pharmacistPhoto from '../../assets/743adaa0df674d85b7d6284b39affda9_pharmacist_photo.png';

export default function PatientLanding() {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <Navbar />

      <main className="w-full pt-20 flex-grow">
        <div className="flex flex-col w-full">
          {/* Hero Section */}
          <section className="w-full relative px-4 sm:px-8 lg:px-16 py-12 lg:py-24 max-w-content mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            {/* Hero Left Content */}
            <div className="flex flex-col w-full lg:w-1/2 z-10">
              <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-6 leading-tight">
                Medicine you can trust, verified in seconds.
              </h1>
              <p className="font-body text-lg text-on-surface-variant mb-10 max-w-lg">
                Scan any medicine strip to confirm authenticity, verify its source, and access instant dosage information from medical experts.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto">
                <Link to="/patient/scan" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" fullWidth>
                    SCAN A MEDICINE
                  </Button>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button variant="ghost" size="lg" fullWidth>
                    SEE HOW IT WORKS
                  </Button>
                </a>
              </div>

              {/* Trust Row */}
              <div className="flex items-center gap-4 bg-surface-container rounded-full py-2.5 px-5 w-max shadow-sm border border-outline-variant/20">
                <div className="flex items-center gap-1 text-secondary-container">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-secondary-fixed text-lg">
                      star
                    </span>
                  ))}
                </div>
                <span className="font-body text-sm text-on-surface-variant">
                  <strong className="text-on-surface font-bold">12,400+</strong> medicines verified
                </span>
              </div>
            </div>

            {/* Hero Right: Image & Overlay */}
            <div className="w-full lg:w-1/2 relative">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-xl bg-surface-container-high group">
                <img
                  src={pharmacistPhoto}
                  alt="Pharmacist in clean modern medical environment"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>

                {/* Floating Overlay Card */}
                <div className="absolute -bottom-4 -left-4 sm:bottom-6 sm:-left-8 z-20 bg-surface/95 backdrop-blur-xl p-5 rounded-2xl shadow-level-2 border border-outline-variant/30 flex items-center gap-4 transition-transform duration-500 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-2xl">verified</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body text-sm text-primary font-bold">Verified Authentic</span>
                    <div className="mt-1">
                      <BatchBadge id="VM-882-QX" prefix="Batch ID" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Blister Motif Spatial Divider */}
          <BlisterDivider count={24} />

          {/* Trust Metrics Band */}
          <section className="w-full bg-surface-container-low py-16 px-4 sm:px-8 shadow-sm z-10 relative border-y border-outline-variant/20">
            <div className="max-w-content mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-outline-variant/20">
              <div className="flex flex-col items-center justify-center text-center pt-8 md:pt-0">
                <span className="font-headline text-5xl font-bold text-primary mb-2">4.2M+</span>
                <span className="font-label-caps text-xs text-outline uppercase tracking-widest font-bold">Scans Performed</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center pt-8 md:pt-0 md:pl-8">
                <span className="font-headline text-5xl font-bold text-primary mb-2">1,200+</span>
                <span className="font-label-caps text-xs text-outline uppercase tracking-widest font-bold">Registered Pharmacies</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center pt-8 md:pt-0 md:pl-8">
                <span className="font-headline text-5xl font-bold text-primary mb-2">840</span>
                <span className="font-label-caps text-xs text-outline uppercase tracking-widest font-bold">Diversions Prevented</span>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="w-full py-24 px-4 sm:px-8 bg-surface relative overflow-hidden" id="how-it-works">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-fixed/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <div className="max-w-content mx-auto relative z-10">
              <div className="flex flex-col items-center mb-16 text-center">
                <span className="font-label-caps text-xs text-primary-container uppercase tracking-wider font-bold mb-3">Process</span>
                <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary max-w-2xl">
                  Verification made simple.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Step 1 */}
                <Card variant="outlined" rounded="xl" className="p-8 relative overflow-hidden group hover:shadow-level-2 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary text-3xl">qr_code_scanner</span>
                  </div>
                  <span className="absolute top-4 right-6 font-headline text-[120px] leading-none text-surface-container-high opacity-40 font-bold pointer-events-none">1</span>
                  <h3 className="font-headline text-xl font-bold text-primary mb-4">Scan the strip</h3>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                    Use your device's camera to seamlessly scan the secure matrix code printed on the medicine blister pack.
                  </p>
                </Card>

                {/* Step 2 */}
                <Card variant="outlined" rounded="xl" className="p-8 relative overflow-hidden group hover:shadow-level-2 transition-all md:-translate-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-md">
                    <span className="material-symbols-outlined text-on-primary text-3xl">science</span>
                  </div>
                  <span className="absolute top-4 right-6 font-headline text-[120px] leading-none text-surface-container-high opacity-40 font-bold pointer-events-none">2</span>
                  <h3 className="font-headline text-xl font-bold text-primary mb-4">Get instant info</h3>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                    View immutable authenticity records, origin source data, and clinical dosage information in real-time.
                  </p>
                </Card>

                {/* Step 3 */}
                <Card variant="outlined" rounded="xl" className="p-8 relative overflow-hidden group hover:shadow-level-2 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-secondary-container flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-on-secondary-container text-3xl">local_pharmacy</span>
                  </div>
                  <span className="absolute top-4 right-6 font-headline text-[120px] leading-none text-surface-container-high opacity-40 font-bold pointer-events-none">3</span>
                  <h3 className="font-headline text-xl font-bold text-primary mb-4">Confirm purchase</h3>
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                    Shop with absolute confidence knowing your medical products are genuine and supply-chain verified.
                  </p>
                </Card>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant/20 py-12 px-4 sm:px-8 mt-auto">
        <div className="max-w-content mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="font-headline text-xl font-bold text-primary">MedTrace Integrity Systems</span>
          </div>
          <p className="font-body text-xs text-on-surface-variant">
            © 2026 MedTrace Clinical Trust. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
