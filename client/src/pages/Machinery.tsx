import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Wrench,
  Calendar,
  Check,
  AlertCircle,
  PlusCircle,
  MapPin,
  Filter,
  Eye,
  ArrowRight,
  ShieldCheck,
  Phone,
  Gauge,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import api from '../services/api';
import { MachineryListing, MachineryBooking } from '../types';
import { formatINR, calculateLineTotal } from '../utils/currency';
import { useAuth } from '../context/AuthContext';
import { MachineryCard, getMachineryTypeLabel, getMachineryImage } from '../components/MachineryCard';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';

// 12 Indian Agricultural Machinery Types with actual photographs
const ALL_MACHINERY_CATEGORIES = [
  { id: 'All', name: 'All Machinery', desc: 'Browse complete fleet', image: '/machinery/tractor.jpg' },
  { id: 'tractor', name: 'Tractor', desc: 'Land prep & farm work', image: '/machinery/tractor.jpg' },
  { id: 'rotavator', name: 'Rotavator', desc: 'Soil clod breaking', image: '/machinery/rotavator.jpg' },
  { id: 'cultivator', name: 'Cultivator', desc: 'Soil aeration & weeding', image: '/machinery/cultivator.jpg' },
  { id: 'power_tiller', name: 'Power Tiller', desc: 'Small farm narrow fields', image: '/machinery/power_tiller.jpg' },
  { id: 'combine_harvester', name: 'Combine Harvester', desc: 'Grain cutting & threshing', image: '/machinery/combine_harvester.jpg' },
  { id: 'paddy_transplanter', name: 'Paddy Transplanter', desc: 'Precision rice planting', image: '/machinery/paddy_transplanter.jpg' },
  { id: 'seed_drill', name: 'Seed Drill', desc: 'Row sowing & fertilizer', image: '/machinery/seed_drill.jpg' },
  { id: 'sprayer', name: 'Agri Sprayer', desc: 'Crop protection boom', image: '/machinery/sprayer.jpg' },
  { id: 'thresher', name: 'Thresher', desc: 'Clean grain separation', image: '/machinery/thresher.jpg' },
  { id: 'water_pump', name: 'Water Pump Set', desc: 'Irrigation & dewatering', image: '/machinery/water_pump.jpg' },
  { id: 'tractor_trailer', name: 'Tractor Trailer', desc: 'Crop & manure hauling', image: '/machinery/tractor_trailer.jpg' },
  { id: 'brush_cutter', name: 'Brush Cutter', desc: 'Grass & weed clearing', image: '/machinery/brush_cutter.jpg' },
];

export const Machinery: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Active view tab: marketplace browse or user bookings
  const [activeTab, setActiveTab] = useState<'browse' | 'my_bookings'>('browse');

  // Category view expansion: Top 8 (clean default) vs All 12
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Machinery listings and filters
  const [machineryList, setMachineryList] = useState<MachineryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [rentalUnitFilter, setRentalUnitFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState('newest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modals state
  const [detailsMachine, setDetailsMachine] = useState<MachineryListing | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<MachineryListing | null>(null);

  // Booking Form State
  const [durationUnits, setDurationUnits] = useState(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookingAddress, setBookingAddress] = useState('');
  const [renterName, setRenterName] = useState(user?.name || '');
  const [renterPhone, setRenterPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // My Bookings State
  const [myBookings, setMyBookings] = useState<MachineryBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (user) {
      if (!renterName) setRenterName(user.name);
      if (!renterPhone) setRenterPhone(user.phone || '');
    }
  }, [user]);

  // Fetch Machinery Listings
  const fetchMachinery = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.append('search', search.trim());
      if (selectedCategory && selectedCategory !== 'All') query.append('machineryType', selectedCategory);
      if (districtFilter && districtFilter !== 'All') query.append('district', districtFilter);
      if (rentalUnitFilter && rentalUnitFilter !== 'All') query.append('rentalUnit', rentalUnitFilter);
      if (availabilityFilter && availabilityFilter !== 'All') query.append('availabilityStatus', availabilityFilter);
      if (minPrice !== '') query.append('minPrice', minPrice.toString());
      if (maxPrice !== '') query.append('maxPrice', maxPrice.toString());
      if (sortBy) query.append('sort', sortBy);

      const res = await api.get(`/machinery?${query.toString()}`);
      if (res.data.success) {
        setMachineryList(res.data.machinery);
      }
    } catch (err) {
      console.error('Failed to load machinery:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch User's Machinery Bookings
  const fetchMyBookings = async () => {
    if (!isAuthenticated) return;
    setLoadingBookings(true);
    try {
      const res = await api.get('/machinery/bookings/my');
      if (res.data.success) {
        setMyBookings(res.data.bookings);
      }
    } catch (err) {
      console.error('Failed to load user machinery bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchMachinery();
  }, [selectedCategory, districtFilter, rentalUnitFilter, availabilityFilter, sortBy]);

  useEffect(() => {
    if (activeTab === 'my_bookings') {
      fetchMyBookings();
    }
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMachinery();
  };

  const handleOpenBooking = (machine: MachineryListing) => {
    setSelectedMachine(machine);
    setDetailsMachine(null);
    setBookingError(null);
    setBookingSuccess(null);
    setBookingAddress(user?.location?.address || `${machine.location.town || machine.location.district}, ${machine.location.state}`);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=/machinery');
      return;
    }

    if (!selectedMachine) return;

    setBookingSubmitting(true);
    setBookingError(null);

    try {
      const res = await api.post(`/machinery/${selectedMachine._id}/book`, {
        startDate,
        endDate,
        durationUnits: Number(durationUnits),
        bookingLocation: {
          address: bookingAddress.trim(),
          district: selectedMachine.location.district,
          state: selectedMachine.location.state,
        },
        notes: notes.trim(),
      });

      if (res.data.success) {
        setBookingSuccess(`Booking request for ${selectedMachine.title} has been submitted to ${selectedMachine.ownerName}!`);
        setTimeout(() => {
          setBookingSuccess(null);
          setSelectedMachine(null);
          setActiveTab('my_bookings');
        }, 2200);
      }
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Failed to submit booking request.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const calculatedTotal = selectedMachine
    ? calculateLineTotal(selectedMachine.rentalPrice, Number(durationUnits) || 1)
    : 0;

  // Sliced category categories: First 8 vs All 12
  const visibleCategories = showAllCategories
    ? ALL_MACHINERY_CATEGORIES
    : ALL_MACHINERY_CATEGORIES.slice(0, 9); // 'All' + 8 types = 9 items

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* SECTION 1: PAGE BANNER & TITLE */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 rounded-3xl p-6 sm:p-10 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/60 backdrop-blur-xs text-emerald-100 text-xs font-semibold">
            <Wrench className="w-3.5 h-3.5" />
            <span>Farm Power & Mechanization Marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Agricultural Machinery Rentals
          </h1>
          <p className="text-sm sm:text-base text-emerald-100">
            Rent verified tractors, rotavators, combine harvesters, power tillers, and sprayers with genuine photographs and skilled operators in Indian Rupees (₹ / INR).
          </p>
        </div>

        {/* Tab Switcher & Provider Fleet Link */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-emerald-600/60 mt-6">
          <div className="flex items-center bg-emerald-900/60 p-1 rounded-xl backdrop-blur-xs text-xs font-semibold">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'browse'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              Browse Machinery Catalog
            </button>
            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('my_bookings')}
                className={`px-4 py-1.5 rounded-lg transition-all ${
                  activeTab === 'my_bookings'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                My Rental Bookings
              </button>
            )}
          </div>

          {isAuthenticated && (user?.role === 'machinery_owner' || user?.role === 'admin') && (
            <button
              onClick={() => navigate('/dashboard/machinery')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              <span>Owner Dashboard & Fleet</span>
            </button>
          )}
        </div>

        {/* Search & Quick Filter Bar */}
        {activeTab === 'browse' && (
          <form
            onSubmit={handleSearchSubmit}
            className="relative z-10 mt-6 bg-white p-4 sm:p-5 rounded-2xl shadow-xl border border-stone-200 text-stone-900 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="lg:col-span-2 relative">
                <label className="block font-bold text-stone-700 mb-1">Search Machinery</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by machine name, rotavator, harvester, brand..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Location District</label>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-medium text-stone-800"
                >
                  <option value="All">All Districts</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Tiruppur">Tiruppur</option>
                  <option value="Erode">Erode</option>
                  <option value="Salem">Salem</option>
                  <option value="Thanjavur">Thanjavur (Delta)</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`p-2.5 border rounded-xl transition-colors ${
                    showAdvancedFilters
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                  title="Advanced Price & Unit Filters"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Advanced Filters Expandable Drawer */}
            {showAdvancedFilters && (
              <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">Rental Unit</label>
                  <select
                    value={rentalUnitFilter}
                    onChange={(e) => setRentalUnitFilter(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50"
                  >
                    <option value="All">All Pricing Units</option>
                    <option value="hour">Per Hour (₹/hr)</option>
                    <option value="day">Per Day (₹/day)</option>
                    <option value="acre">Per Acre (₹/acre)</option>
                    <option value="hectare">Per Hectare</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">Availability</label>
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50"
                  >
                    <option value="All">All Statuses</option>
                    <option value="available">Ready for Rent</option>
                    <option value="booked">Booked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">Min Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Min ₹"
                    className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">Sort Results</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50"
                  >
                    <option value="newest">Newest Listings</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      {/* VIEW 1: BROWSE MACHINERY CATALOG */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* SECTION 2: 12 MACHINERY CATEGORY CARDS WITH MATCHING IMAGES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Select Machinery Category
                </h2>
                <p className="text-xs text-stone-500">
                  Showing accurate Indian farm machinery photographs. Never generic images.
                </p>
              </div>

              {/* Recommendation toggle: First 8 vs All 12 */}
              <button
                type="button"
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
              >
                <span>{showAllCategories ? 'Show Top 8 Categories' : 'View All 12 Machinery Types'}</span>
                {showAllCategories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-2.5">
              {visibleCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-2 rounded-2xl text-left border transition-all flex flex-col justify-between group overflow-hidden ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500'
                        : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="w-full aspect-16/11 rounded-xl overflow-hidden mb-2 bg-stone-100">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/machinery/tractor.jpg';
                        }}
                      />
                    </div>
                    <div>
                      <div className={`text-xs font-bold leading-tight line-clamp-1 ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                        {cat.name}
                      </div>
                      <div className={`text-[10px] font-medium mt-0.5 line-clamp-1 ${isSelected ? 'text-emerald-100' : 'text-stone-500'}`}>
                        {cat.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: MACHINERY LISTING CARDS GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-700">
                Available Machinery Listings ({machineryList.length})
              </h3>
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs text-emerald-700 font-semibold hover:underline"
                >
                  Show all categories
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-80 bg-stone-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : machineryList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
                <Wrench className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="text-base font-bold text-stone-800">No machinery listings match your search</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Try clearing your search query or selecting a different machinery category.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('All');
                    setDistrictFilter('All');
                    setRentalUnitFilter('All');
                    setAvailabilityFilter('All');
                    setMinPrice('');
                    setMaxPrice('');
                    fetchMachinery();
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {machineryList.map((m) => (
                  <MachineryCard
                    key={m._id}
                    machinery={m}
                    onBook={handleOpenBooking}
                    onViewDetails={(machine) => setDetailsMachine(machine)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: USER'S MACHINERY BOOKINGS TAB */}
      {activeTab === 'my_bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">My Machinery Rental Bookings</h2>
              <p className="text-xs text-stone-500">
                Track status and view confirmation updates from machinery providers.
              </p>
            </div>
            <button
              onClick={fetchMyBookings}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              Refresh
            </button>
          </div>

          {loadingBookings ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="h-32 bg-stone-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : myBookings.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
              <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-sm font-bold text-stone-700">No machinery reservations yet</h3>
              <p className="text-xs text-stone-500">
                Browse our farm equipment marketplace and reserve a tractor, rotavator, or harvester for your field.
              </p>
              <button
                onClick={() => setActiveTab('browse')}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Browse Equipment Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.map((b) => (
                <div
                  key={b._id}
                  className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <div className="text-sm font-bold text-stone-900">
                        {b.machineryTitle}
                      </div>
                      <div className="text-xs text-stone-500 font-mono">
                        Booking ID: {b._id.slice(-6).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          b.status === 'accepted'
                            ? 'green'
                            : b.status === 'pending'
                            ? 'amber'
                            : b.status === 'rejected'
                            ? 'red'
                            : 'gray'
                        }
                        size="sm"
                      >
                        {b.status.toUpperCase()}
                      </Badge>
                      <span className="text-base font-extrabold text-emerald-700">
                        {formatINR(b.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[11px]">Work Location</span>
                      <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {b.bookingLocation.address || b.bookingLocation.district}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">Duration Reserved</span>
                      <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        {b.durationUnits} {b.unitType}s @ {formatINR(b.unitPrice)} / {b.unitType}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">Dates</span>
                      <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        {new Date(b.startDate).toLocaleDateString('en-IN')} → {new Date(b.endDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {b.notes && (
                    <div className="p-2.5 bg-stone-50 rounded-xl text-xs text-stone-600 border border-stone-100">
                      <strong>Special Instructions:</strong> {b.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {detailsMachine && (
        <Modal
          isOpen={!!detailsMachine}
          onClose={() => setDetailsMachine(null)}
          title={detailsMachine.title}
        >
          <div className="space-y-4 text-xs">
            <div className="aspect-16/9 bg-stone-100 rounded-xl overflow-hidden relative">
              <img
                src={getMachineryImage(detailsMachine.machineryType, detailsMachine.images)}
                alt={detailsMachine.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getMachineryImage(detailsMachine.machineryType);
                }}
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize">
                  {getMachineryTypeLabel(detailsMachine.machineryType)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[11px] text-stone-500">Rental Rate</div>
                <div className="text-base font-bold text-emerald-800">
                  {formatINR(detailsMachine.rentalPrice)} / {detailsMachine.rentalUnit}
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[11px] text-stone-500">Base Location</div>
                <div className="text-sm font-bold text-stone-900">
                  {detailsMachine.location.town || detailsMachine.location.district}, {detailsMachine.location.state}
                </div>
              </div>
            </div>

            <div>
              <span className="font-bold text-stone-800">Machine Description</span>
              <p className="text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100 mt-1">
                {detailsMachine.description}
              </p>
            </div>

            {/* Specifications */}
            <div className="space-y-1">
              <span className="font-bold text-stone-800">Technical Specifications</span>
              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100">
                <div>Power: <strong>{detailsMachine.specifications?.horsepower || 'Standard'}</strong></div>
                <div>Fuel Type: <strong>{detailsMachine.specifications?.fuelType || 'Diesel'}</strong></div>
                <div>Model Year: <strong>{detailsMachine.specifications?.modelYear || '2023'}</strong></div>
                <div>Attachments: <strong>{detailsMachine.specifications?.attachments?.join(', ') || 'Standard Implements'}</strong></div>
              </div>
            </div>

            {/* Booking Rules */}
            <div className="space-y-1">
              <span className="font-bold text-stone-800">Operator & Fuel Terms</span>
              <p className="text-stone-600 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                {detailsMachine.bookingRules || 'Skilled operator provided. Fuel cost as agreed upon dispatch.'}
              </p>
            </div>

            {/* Owner Contact */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-500 block">Fleet Owner</span>
                <span className="font-bold text-stone-900 text-sm">{detailsMachine.ownerName}</span>
              </div>
              {detailsMachine.ownerPhone && (
                <a
                  href={`tel:${detailsMachine.ownerPhone}`}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Owner</span>
                </a>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDetailsMachine(null)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleOpenBooking(detailsMachine)}
                disabled={detailsMachine.availabilityStatus !== 'available'}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book This Machine</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* SECTION 4: MACHINERY BOOKING MODAL */}
      {selectedMachine && (
        <Modal
          isOpen={!!selectedMachine}
          onClose={() => setSelectedMachine(null)}
          title={`Reserve: ${selectedMachine.title}`}
        >
          {bookingSuccess ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-stone-900">Rental Request Submitted!</h4>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">{bookingSuccess}</p>
              <div className="text-[11px] text-stone-400">Redirecting to your rental bookings tab...</div>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              {/* Machine Header with Photo */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                <div className="w-16 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                  <img
                    src={getMachineryImage(selectedMachine.machineryType, selectedMachine.images)}
                    alt={selectedMachine.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-emerald-800">
                    {getMachineryTypeLabel(selectedMachine.machineryType)}
                  </div>
                  <div className="text-sm font-bold text-emerald-950 truncate">
                    {selectedMachine.title}
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    {formatINR(selectedMachine.rentalPrice)} / {selectedMachine.rentalUnit}
                  </div>
                </div>
              </div>

              {bookingError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Renter Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Farmer / Renter Name</label>
                  <input
                    type="text"
                    required
                    value={renterName}
                    onChange={(e) => setRenterName(e.target.value)}
                    placeholder="e.g. Murugan Selvam"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    value={renterPhone}
                    onChange={(e) => setRenterPhone(e.target.value)}
                    placeholder="e.g. +91 98421 11223"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
                  />
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Required Start Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Required End Date</label>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-800"
                  />
                </div>
              </div>

              {/* Duration or Area Units */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Expected Duration or Work Area ({selectedMachine.rentalUnit}s)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={durationUnits}
                  onChange={(e) => setDurationUnits(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-800 font-extrabold text-sm"
                />
              </div>

              {/* Farm Field Address */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Farm / Field Work Location</label>
                <input
                  type="text"
                  required
                  value={bookingAddress}
                  onChange={(e) => setBookingAddress(e.target.value)}
                  placeholder="e.g. Survey No. 42, Thondamuthur East Canal, Coimbatore"
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-800"
                />
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Special Operator Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Deep tilling for tomato bed cultivation. Need rotavator attachment."
                  className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50 text-stone-800 text-xs"
                />
              </div>

              {/* Estimated Rental Amount Breakdown */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-stone-500 font-medium">Estimated Rental Amount</div>
                  <div className="text-xl font-black text-emerald-800">
                    {formatINR(calculatedTotal)}
                  </div>
                </div>
                <div className="text-[11px] text-stone-500 text-right">
                  {durationUnits} {selectedMachine.rentalUnit}s × {formatINR(selectedMachine.rentalPrice)}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedMachine(null)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {bookingSubmitting ? 'Submitting...' : 'Confirm Machinery Rental'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
