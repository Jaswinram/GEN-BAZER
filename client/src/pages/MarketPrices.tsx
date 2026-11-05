import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Calendar, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { MarketPrice } from '../types';
import { formatINR } from '../utils/currency';
import { Badge } from '../components/Badge';

export const MarketPrices: React.FC = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cropSearch, setCropSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [unitFilter, setUnitFilter] = useState('All');

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (cropSearch) query.append('crop', cropSearch);
      if (districtFilter && districtFilter !== 'All') query.append('district', districtFilter);
      if (unitFilter && unitFilter !== 'All') query.append('unit', unitFilter);

      const res = await api.get(`/market-prices?${query.toString()}`);
      if (res.data.success) {
        setPrices(res.data.marketPrices);
      }
    } catch (err) {
      console.error('Failed to load market prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [districtFilter, unitFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrices();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
          <TrendingUp className="w-4 h-4" />
          <span>APMC & Mandi Market Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
          Daily Agricultural Mandi Benchmark Prices
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
          Wholesale trading benchmark rates compiled from regulated agricultural marketing committees across Tamil Nadu in Indian Rupees (₹ / INR).
        </p>
      </div>

      {/* Transparency Disclaimer Notice */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Verified Daily Benchmark Notice:</strong> Gen Baazar displays recorded wholesale auction arrivals and modal prices from recognized regional mandis (e.g. Coimbatore MGR Market, Koyambedu Chennai, Erode Turmeric Mandi). Prices are updated daily and serve as transaction references for farmers and merchants.
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={cropSearch}
            onChange={(e) => setCropSearch(e.target.value)}
            placeholder="Search crop or variety (e.g. Tomato, Onion, Turmeric, Paddy)..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:border-emerald-500"
          />
        </form>

        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 focus:outline-hidden"
        >
          <option value="All">All Mandi Districts</option>
          <option value="Coimbatore">Coimbatore</option>
          <option value="Chennai">Chennai</option>
          <option value="Thanjavur">Thanjavur</option>
          <option value="Erode">Erode</option>
          <option value="Madurai">Madurai</option>
        </select>

        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 focus:outline-hidden"
        >
          <option value="All">All Units (kg / quintal)</option>
          <option value="kg">Per Kilogram (kg)</option>
          <option value="quintal">Per Quintal (100 kg)</option>
        </select>

        <button
          onClick={fetchPrices}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          Search Rates
        </button>
      </div>

      {/* Market Prices Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-12 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : prices.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs">
            No mandi price records found for this selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Commodity / Variety</th>
                  <th className="py-3.5 px-4">Market / Mandi</th>
                  <th className="py-3.5 px-4">District</th>
                  <th className="py-3.5 px-4 text-center">Unit</th>
                  <th className="py-3.5 px-4 text-right">Modal Rate (INR)</th>
                  <th className="py-3.5 px-4 text-right">Min - Max Range</th>
                  <th className="py-3.5 px-4">Official Source / Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {prices.map((mp) => (
                  <tr key={mp._id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900 text-sm">{mp.cropName}</div>
                      <div className="text-[11px] text-stone-400">{mp.variety}</div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-stone-800">
                      {mp.marketName}
                    </td>

                    <td className="py-3.5 px-4 text-stone-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>{mp.district}, {mp.state}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold px-2 py-0.5 bg-stone-100 rounded-md text-stone-700">
                        {mp.priceUnit}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="text-base font-extrabold text-emerald-800">
                        {formatINR(mp.modalPrice)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right text-stone-600">
                      {formatINR(mp.minPrice)} – {formatINR(mp.maxPrice)}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500">
                      <div className="text-[11px] font-medium text-stone-700 truncate max-w-xs">{mp.source}</div>
                      <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(mp.priceDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

