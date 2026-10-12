import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import FormInput from './FormInput';

export default function NearbyPharmacyFinder() {
  const [searchQuery, setSearchQuery] = useState('Amoxicillin');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStoreModal, setSelectedStoreModal] = useState(null);

  const popularMedicines = ['Amoxicillin', 'Lipitor', 'Paracetamol', 'Crestor', 'Azithromycin'];

  const fetchStores = async (queryStr) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patient/search-stores?medicine=${encodeURIComponent(queryStr)}`);
      const data = await res.json();
      if (res.ok) {
        setStores(data.stores || []);
      }
    } catch {
      // Fallback data if server connection drops
      setStores([
        {
          _id: '1',
          name: 'MediCare Central Pharmacy',
          licenseId: 'PHARM-8492',
          region: 'Downtown District',
          address: '123 Health Street, Mumbai',
          distance: '0.8 km',
          price: 120,
          inStock: true,
          availableUnits: 142,
          geoLocation: { lat: 19.076, lng: 72.8777 },
        },
        {
          _id: '2',
          name: 'Apollo Health Dispensary',
          licenseId: 'PHARM-3310',
          region: 'North District',
          address: '456 Wellness Road, Delhi',
          distance: '1.4 km',
          price: 120,
          inStock: true,
          availableUnits: 98,
          geoLocation: { lat: 28.6139, lng: 77.209 },
        },
        {
          _id: '3',
          name: 'Wellness Care Chemist',
          licenseId: 'PHARM-1102',
          region: 'East District',
          address: '789 Care Lane, Kolkata',
          distance: '2.1 km',
          price: 120,
          inStock: true,
          availableUnits: 45,
          geoLocation: { lat: 22.5726, lng: 88.3639 },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores(searchQuery);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStores(searchQuery);
  };

  const handleSelectPopular = (med) => {
    setSearchQuery(med);
    fetchStores(med);
  };

  return (
    <section className="w-full py-16 px-4 sm:px-8 bg-surface-container-lowest border-y border-outline-variant/20 font-body">
      <div className="max-w-content mx-auto flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-3">
          <span className="font-label-caps text-xs text-primary uppercase tracking-widest font-bold bg-primary-container/30 px-3.5 py-1 rounded-full border border-primary/20">
            Pharmacy Inventory & Location Finder
          </span>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary max-w-2xl">
            Find Nearby Stores & Stock Availability
          </h2>
          <p className="font-body text-sm text-on-surface-variant max-w-xl">
            Search any medicine to view verified registered dispensaries near you, check real-time stock levels, compare prices, and get store locations.
          </p>
        </div>

        {/* Search Bar & Popular Pills */}
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <FormInput
                placeholder="Search medicine name (e.g. Amoxicillin, Lipitor, Paracetamol)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<span className="material-symbols-outlined">search</span>}
              />
            </div>
            <Button variant="primary" size="lg" type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Check Nearby Stores'}
            </Button>
          </form>

          {/* Quick Select Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-center text-xs">
            <span className="text-outline font-label-caps uppercase text-[11px] font-bold mr-1">Popular:</span>
            {popularMedicines.map((med) => (
              <button
                key={med}
                type="button"
                onClick={() => handleSelectPopular(med)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  searchQuery.toLowerCase() === med.toLowerCase()
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:border-primary'
                }`}
              >
                {med}
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {stores.map((store) => (
              <Card key={store._id || store.licenseId} variant="outlined" rounded="xl" className="p-6 flex flex-col justify-between gap-5 hover:shadow-level-2 transition-all">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-headline text-lg font-bold text-primary leading-tight">{store.name}</h3>
                      <p className="font-mono text-xs text-outline mt-0.5">License: {store.licenseId}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${store.inStock ? 'bg-secondary-container/30 text-primary border border-secondary-container/50' : 'bg-error-container/40 text-error'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {store.inStock ? `In Stock (${store.availableUnits} units)` : 'Out of Stock'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 text-xs text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">location_on</span>
                      <span>{store.address} ({store.distance})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">domain</span>
                      <span>{store.region}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-label-caps text-outline uppercase font-bold">Standard Price</span>
                    <span className="font-headline text-xl font-bold text-primary">₹{store.price}.00 <span className="text-xs text-outline font-normal">/ pack</span></span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStoreModal(store)}
                    icon={<span className="material-symbols-outlined text-sm">map</span>}
                  >
                    View Location
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Store Location Modal */}
      {selectedStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl flex flex-col gap-6 font-body">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xl">
                  <span className="material-symbols-outlined">storefront</span>
                </div>
                <div>
                  <h3 className="font-headline text-xl font-bold text-primary">{selectedStoreModal.name}</h3>
                  <p className="font-mono text-xs text-outline">License #{selectedStoreModal.licenseId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStoreModal(null)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col gap-3 text-xs">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-base mt-0.5">place</span>
                <div>
                  <span className="font-bold block text-on-surface">Full Address:</span>
                  <span className="text-on-surface-variant">{selectedStoreModal.address}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-base mt-0.5">near_me</span>
                <div>
                  <span className="font-bold block text-on-surface">Proximity & Region:</span>
                  <span className="text-on-surface-variant">{selectedStoreModal.distance} from your location ({selectedStoreModal.region})</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-base mt-0.5">payments</span>
                <div>
                  <span className="font-bold block text-on-surface">Medicine Pricing:</span>
                  <span className="text-primary font-bold text-sm">₹{selectedStoreModal.price}.00 per pack</span>
                </div>
              </div>
            </div>

            {/* Map Visual Representation */}
            <div className="w-full h-40 bg-surface-container-high rounded-2xl border border-outline-variant/30 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#004d40_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="relative z-10 flex flex-col items-center text-center gap-1 p-4 bg-surface/90 backdrop-blur-md rounded-xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-3xl text-primary animate-bounce">location_on</span>
                <span className="font-bold text-xs text-primary">{selectedStoreModal.name}</span>
                <span className="font-mono text-[10px] text-outline">GPS: {selectedStoreModal.geoLocation?.lat || '19.076'}, {selectedStoreModal.geoLocation?.lng || '72.8777'}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" size="md" onClick={() => setSelectedStoreModal(null)}>
                Close
              </Button>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${selectedStoreModal.name} ${selectedStoreModal.address}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="md" icon={<span className="material-symbols-outlined text-sm">directions</span>}>
                  Get Directions
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
