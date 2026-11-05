import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sprout,
  Truck,
  Wrench,
  TrendingUp,
  ShieldCheck,
  Users,
  Package,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { Product, MachineryListing, TransportListing, MarketPrice } from '../types';
import { formatINR } from '../utils/currency';
import { useLanguage } from '../context/LanguageContext';
import { VoiceSearch } from '../components/VoiceSearch';
import { ProductCard } from '../components/ProductCard';
import { MachineryCard } from '../components/MachineryCard';
import { TransportCard } from '../components/TransportCard';
import { Modal } from '../components/Modal';

export const Home: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentMachinery, setRecentMachinery] = useState<MachineryListing[]>([]);
  const [recentTransport, setRecentTransport] = useState<TransportListing[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick booking modal states
  const [selectedMachine, setSelectedMachine] = useState<MachineryListing | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<TransportListing | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, machRes, transRes, priceRes] = await Promise.all([
          api.get('/products?limit=4'),
          api.get('/machinery'),
          api.get('/transport'),
          api.get('/market-prices'),
        ]);

        if (prodRes.data.success) setFeaturedProducts(prodRes.data.products);
        if (machRes.data.success) setRecentMachinery(machRes.data.machinery.slice(0, 3));
        if (transRes.data.success) setRecentTransport(transRes.data.transport.slice(0, 3));
        if (priceRes.data.success) setMarketPrices(priceRes.data.marketPrices.slice(0, 6));
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleVoiceSearch = (transcript: string) => {
    setSearchQuery(transcript);
    navigate(`/products?search=${encodeURIComponent(transcript)}`);
  };

  const categories = [
    { name: 'Vegetables', label: 'Vegetables', icon: '🥦', query: 'Vegetables' },
    { name: 'Grains & Pulses', label: 'Grains & Pulses', icon: '🌾', query: 'Grains & Pulses' },
    { name: 'Spices', label: 'Spices', icon: '🌶️', query: 'Spices' },
    { name: 'Seeds', label: 'Seeds', icon: '🌱', query: 'Seeds' },
    { name: 'Fertilizers', label: 'Fertilizers', icon: '🧪', query: 'Fertilizers' },
    { name: 'Machinery', label: 'Machinery', icon: '🚜', link: '/machinery' },
    { name: 'Transport', label: 'Logistics', icon: '🚛', link: '/transport' },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-850 to-emerald-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Subtle patterned overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Connecting Farmers, Buyers & <span className="text-emerald-300">Mechanization</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-emerald-100/90 font-normal">
            Buy and sell fresh farm harvests, book tractors and harvesters on-demand, hire agricultural transport, and check live mandi rates — all on Gen Baazar.
          </p>

          {/* SEARCH BAR WITH VOICE INPUT */}
          <div className="max-w-3xl mx-auto mt-8">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center bg-white p-2 rounded-2xl shadow-2xl border border-emerald-200/40"
            >
              <Search className="w-5 h-5 text-stone-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full px-3 py-2 text-stone-800 placeholder-stone-400 text-sm sm:text-base focus:outline-hidden bg-transparent"
              />
              <VoiceSearch onSearch={handleVoiceSearch} className="mr-2 shrink-0" />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shrink-0 shadow-xs"
              >
                {t('searchBtn')}
              </button>
            </form>
          </div>

          {/* QUICK CATEGORY SHORTCUTS */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4">
            {categories.map((c) =>
              c.link ? (
                <Link
                  key={c.name}
                  to={c.link}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-700/80 border border-emerald-700/50 text-xs font-medium text-emerald-100 transition-colors"
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </Link>
              ) : (
                <Link
                  key={c.name}
                  to={`/products?category=${encodeURIComponent(c.query || '')}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-700/80 border border-emerald-700/50 text-xs font-medium text-emerald-100 transition-colors"
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

      {/* LIVE MARKET MANDI BENCHMARK RATES TICKER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200/80 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                {t('marketMandiPrices')}
              </h3>
            </div>
            <Link
              to="/market-prices"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{t('viewAll')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {marketPrices.map((mp) => (
              <div
                key={mp._id}
                className="p-3 rounded-xl bg-stone-50 border border-stone-100 hover:border-emerald-200 transition-colors"
              >
                <div className="text-xs font-bold text-stone-900 truncate">{mp.cropName}</div>
                <div className="text-[11px] text-stone-500 truncate">{mp.marketName}</div>
                <div className="mt-1 flex items-baseline gap-1 text-sm font-extrabold text-emerald-700">
                  <span>{formatINR(mp.modalPrice)}</span>
                  <span className="text-[10px] font-normal text-stone-500">/ {mp.priceUnit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED AGRICULTURAL PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              {t('featuredProducts')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Fresh vegetable harvests, grain stocks, and certified agri inputs in Indian Rupees
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 bg-stone-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* MACHINERY RENTALS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              {t('machineryRentals')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Rent high-capacity tractors, combine harvesters, and tilling implements per hour or acre
            </p>
          </div>
          <Link
            to="/machinery"
            className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentMachinery.map((m) => (
            <MachineryCard
              key={m._id}
              machinery={m}
              onBook={(machine) => setSelectedMachine(machine)}
            />
          ))}
        </div>
      </section>

      {/* TRANSPORT SERVICES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              {t('transportServices')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Mini trucks, pickups, and heavy freight for reliable farm-to-mandi transit
            </p>
          </div>
          <Link
            to="/transport"
            className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>{t('viewAll')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentTransport.map((tr) => (
            <TransportCard
              key={tr._id}
              transport={tr}
              onRequest={(vehicle) => setSelectedTransport(vehicle)}
            />
          ))}
        </div>
      </section>

      {/* PLATFORM BENEFITS GRID */}
      <section className="bg-stone-100/70 border-y border-stone-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              Why Agriculture Chooses Gen Baazar
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-2">
              A unified agricultural ecosystem engineered for direct farmer income and streamlined logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-base mb-1">{t('farmerBenefitTitle')}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{t('farmerBenefitDesc')}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-base mb-1">{t('buyerBenefitTitle')}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{t('buyerBenefitDesc')}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-base mb-1">{t('machineryBenefitTitle')}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{t('machineryBenefitDesc')}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-900 text-base mb-1">{t('transportBenefitTitle')}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{t('transportBenefitDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-emerald-700 rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Join India's Modern Agricultural Baazar?
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base">
              Register as a farmer, buyer, machinery provider, or transporter today and experience seamless digital agri-trade.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                to="/register"
                className="px-6 py-3 bg-white text-emerald-900 font-bold rounded-xl text-sm hover:bg-emerald-50 transition-colors shadow-md"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 border border-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Explore Demo Roles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK BOOKING MODAL FOR MACHINERY */}
      {selectedMachine && (
        <Modal
          isOpen={!!selectedMachine}
          onClose={() => setSelectedMachine(null)}
          title={`Book ${selectedMachine.title}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-stone-50 rounded-xl text-xs space-y-1">
              <div><strong>Owner:</strong> {selectedMachine.ownerName} ({selectedMachine.ownerPhone || 'Verified'})</div>
              <div><strong>Location:</strong> {selectedMachine.location.town || selectedMachine.location.district}, {selectedMachine.location.state}</div>
              <div className="text-emerald-700 font-bold text-sm">
                Rate: {formatINR(selectedMachine.rentalPrice)} / {selectedMachine.rentalUnit}
              </div>
            </div>

            <p className="text-xs text-stone-600">
              To complete the booking and enter desired rental dates, proceed to the dedicated machinery portal.
            </p>

            <button
              onClick={() => {
                setSelectedMachine(null);
                navigate('/machinery');
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors"
            >
              Open Machinery Booking Center
            </button>
          </div>
        </Modal>
      )}

      {/* QUICK REQUEST MODAL FOR TRANSPORT */}
      {selectedTransport && (
        <Modal
          isOpen={!!selectedTransport}
          onClose={() => setSelectedTransport(null)}
          title={`Book ${selectedTransport.vehicleNumber}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-stone-50 rounded-xl text-xs space-y-1">
              <div><strong>Vehicle:</strong> {selectedTransport.vehicleType.replace('_', ' ')} (Capacity: {selectedTransport.carryingCapacityTonnes} Tonnes)</div>
              <div><strong>Provider:</strong> {selectedTransport.providerName}</div>
              <div className="text-emerald-700 font-bold text-sm">
                Pricing: {selectedTransport.pricingModel === 'custom_quotation' ? 'Custom Quote' : `${formatINR(selectedTransport.baseRate)} (${selectedTransport.pricingModel.replace('_', ' ')})`}
              </div>
            </div>

            <p className="text-xs text-stone-600">
              Specify your pickup farm address, delivery mandi, and cargo weight in the transport dispatch center.
            </p>

            <button
              onClick={() => {
                setSelectedTransport(null);
                navigate('/transport');
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors"
            >
              Open Transport Dispatch Center
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

