import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Truck,
  MapPin,
  Check,
  AlertCircle,
  PlusCircle,
  Weight,
  Calendar,
  Clock,
  Phone,
  User as UserIcon,
  FileText,
  ShieldCheck,
  X,
  XCircle,
  HelpCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import api from '../services/api';
import { TransportListing, TransportBooking } from '../types';
import { formatINR, calculateLineTotal } from '../utils/currency';
import { useAuth } from '../context/AuthContext';
import { TransportCard, getVehicleCategoryLabel, getVehicleImage } from '../components/TransportCard';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';

// 7 Indian Vehicle Categories with indicative capacity ranges & photos
const VEHICLE_CATEGORIES = [
  { id: 'All', name: 'All Vehicles', range: 'Any payload', image: '/vehicles/mini_pickup.jpg' },
  { id: 'bike', name: 'Bike / Motorcycle', range: '1–30 kg', image: '/vehicles/bike.jpg' },
  { id: 'moped_carrier', name: 'Moped / TVS XL', range: '10–60 kg', image: '/vehicles/moped_carrier.jpg' },
  { id: 'electric_scooter', name: 'Electric Scooter', range: '5–40 kg', image: '/vehicles/electric_scooter.jpg' },
  { id: 'auto_rickshaw', name: 'Auto Rickshaw', range: '30–150 kg', image: '/vehicles/auto_rickshaw.jpg' },
  { id: 'electric_auto', name: 'Electric Cargo Auto', range: '50–200 kg', image: '/vehicles/electric_auto.jpg' },
  { id: 'mini_three_wheeler', name: 'Mini 3-Wheeler', range: '100–500 kg', image: '/vehicles/mini_three_wheeler.jpg' },
  { id: 'mini_pickup', name: 'Tata Ace Mini Pickup', range: '200+ kg', image: '/vehicles/mini_pickup.jpg' },
];

export const Transport: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'browse' | 'my_bookings'>('browse');

  // Search & Filter state
  const [transportList, setTransportList] = useState<TransportListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickupSearch, setPickupSearch] = useState('');
  const [deliverySearch, setDeliverySearch] = useState('');
  const [goodsWeightKg, setGoodsWeightKg] = useState<number | ''>('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal states
  const [detailsVehicle, setDetailsVehicle] = useState<TransportListing | null>(null);
  const [bookingVehicle, setBookingVehicle] = useState<TransportListing | null>(null);

  // Booking Form State
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [formPickupLocation, setFormPickupLocation] = useState('');
  const [formDeliveryLocation, setFormDeliveryLocation] = useState('');
  const [goodsDescription, setGoodsDescription] = useState('Fresh farm produce in crates');
  const [formWeightKg, setFormWeightKg] = useState<number>(25);
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().slice(0, 10));
  const [preferredTime, setPreferredTime] = useState('08:00 AM');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [estimatedKm, setEstimatedKm] = useState<number>(15);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // My Bookings State
  const [myBookings, setMyBookings] = useState<TransportBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Keep form customer name/phone in sync with logged in user
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerPhone) setCustomerPhone(user.phone || '');
    }
  }, [user]);

  // Fetch Transport Listings
  const fetchTransport = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (pickupSearch.trim()) query.append('pickupLocation', pickupSearch.trim());
      if (deliverySearch.trim()) query.append('deliveryLocation', deliverySearch.trim());
      if (goodsWeightKg && Number(goodsWeightKg) > 0) {
        query.append('weightKg', goodsWeightKg.toString());
      }
      if (selectedCategory && selectedCategory !== 'All') {
        query.append('vehicleType', selectedCategory);
      }

      const res = await api.get(`/transport?${query.toString()}`);
      if (res.data.success) {
        setTransportList(res.data.transport);
      }
    } catch (err) {
      console.error('Failed to load transport:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's bookings
  const fetchMyBookings = async () => {
    if (!isAuthenticated) return;
    setLoadingBookings(true);
    try {
      const res = await api.get('/transport/requests/my');
      if (res.data.success) {
        setMyBookings(res.data.requests);
      }
    } catch (err) {
      console.error('Failed to load user bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchTransport();
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab === 'my_bookings') {
      fetchMyBookings();
    }
  }, [activeTab]);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransport();
  };

  const handleOpenBooking = (vehicle: TransportListing) => {
    setBookingVehicle(vehicle);
    setDetailsVehicle(null);
    setBookingError(null);
    setBookingSuccess(null);

    // Pre-fill pickup/delivery from search bar if available
    setFormPickupLocation(pickupSearch.trim() || `${vehicle.pickupLocation.town || vehicle.pickupLocation.district}, ${vehicle.pickupLocation.state}`);
    setFormDeliveryLocation(deliverySearch.trim() || 'Local APMC / Wholesale Mandi');

    // Default weight inside vehicle bounds
    const defaultWeight = goodsWeightKg && Number(goodsWeightKg) > 0
      ? Number(goodsWeightKg)
      : Math.min(25, vehicle.carryingCapacityKg);
    setFormWeightKg(defaultWeight);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this transport booking?')) return;
    setCancellingId(bookingId);
    try {
      const res = await api.patch(`/transport/requests/${bookingId}`, { status: 'cancelled' });
      if (res.data.success) {
        fetchMyBookings();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel transport booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=/transport');
      return;
    }

    if (!bookingVehicle) return;

    // Strict validation against vehicle verified payload
    if (formWeightKg > bookingVehicle.carryingCapacityKg) {
      setBookingError(
        `Requested cargo weight (${formWeightKg} kg) exceeds vehicle's verified payload capacity (${bookingVehicle.carryingCapacityKg} kg). Please lower the weight or select a larger vehicle.`
      );
      return;
    }

    setSubmittingBooking(true);
    setBookingError(null);

    try {
      const res = await api.post(`/transport/${bookingVehicle._id}/request`, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        pickupAddress: formPickupLocation.trim(),
        deliveryAddress: formDeliveryLocation.trim(),
        cargoType: goodsDescription.trim(),
        cargoWeightKg: Number(formWeightKg),
        pickupTime: preferredTime,
        specialInstructions: specialInstructions.trim(),
        distanceKm: Number(estimatedKm),
        scheduledDate: preferredDate,
      });

      if (res.data.success) {
        setBookingSuccess(res.data.message || 'Transport booking placed successfully!');
        setTimeout(() => {
          setBookingSuccess(null);
          setBookingVehicle(null);
          setActiveTab('my_bookings');
        }, 2200);
      }
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Failed to submit booking request.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Pricing calculation helper
  const calculatePriceEstimate = (vehicle: TransportListing) => {
    const additional = vehicle.additionalCharges || 0;
    if (vehicle.pricingModel === 'per_trip') {
      return {
        vehicleCharge: vehicle.baseRate,
        additionalCharges: additional,
        total: vehicle.baseRate + additional,
        isQuotation: false,
      };
    }
    if (vehicle.pricingModel === 'per_km') {
      const vCharge = calculateLineTotal(vehicle.baseRate, estimatedKm || 10);
      return {
        vehicleCharge: vCharge,
        additionalCharges: additional,
        total: vCharge + additional,
        isQuotation: false,
      };
    }
    return {
      vehicleCharge: 0,
      additionalCharges: additional,
      total: 0,
      isQuotation: true,
    };
  };

  const priceCalc = bookingVehicle ? calculatePriceEstimate(bookingVehicle) : null;
  const isOverweight = bookingVehicle ? formWeightKg > bookingVehicle.carryingCapacityKg : false;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="amber" size="sm">Pending Confirmation</Badge>;
      case 'accepted':
        return <Badge variant="blue" size="sm">Accepted</Badge>;
      case 'driver_assigned':
        return <Badge variant="purple" size="sm">Driver Assigned</Badge>;
      case 'pickup_completed':
        return <Badge variant="indigo" size="sm">Pickup Completed</Badge>;
      case 'in_transit':
        return <Badge variant="amber" size="sm">In Transit</Badge>;
      case 'delivered':
        return <Badge variant="green" size="sm">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="red" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="gray" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* SECTION A: PAGE HEADER & SEARCH BAR */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 rounded-3xl p-6 sm:p-10 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/60 backdrop-blur-xs text-emerald-100 text-xs font-semibold">
            <Truck className="w-3.5 h-3.5" />
            <span>Farm-to-Mandi Indian Goods Transport (1–200+ kg)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Transport Services
          </h1>
          <p className="text-sm sm:text-base text-emerald-100">
            Find affordable vehicles to transport your agricultural products. Verified goods-carriage payload for bikes, TVS XL mopeds, loading autos, and mini trucks.
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
              Browse Transport Fleet
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
                My Transport Bookings
              </button>
            )}
          </div>

          {isAuthenticated && (user?.role === 'transport_provider' || user?.role === 'admin') && (
            <button
              onClick={() => navigate('/dashboard/transport')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              <span>Provider Dashboard & Fleet</span>
            </button>
          )}
        </div>

        {/* Search Controls Card */}
        {activeTab === 'browse' && (
          <form
            onSubmit={handleHeaderSearch}
            className="relative z-10 mt-6 bg-white p-4 sm:p-5 rounded-2xl shadow-xl border border-stone-200 text-stone-900"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Pickup Location */}
              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pickup Location</span>
                </label>
                <input
                  type="text"
                  value={pickupSearch}
                  onChange={(e) => setPickupSearch(e.target.value)}
                  placeholder="e.g. Thondamuthur Village / Pollachi"
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Delivery Location */}
              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delivery Location</span>
                </label>
                <input
                  type="text"
                  value={deliverySearch}
                  onChange={(e) => setDeliverySearch(e.target.value)}
                  placeholder="e.g. Coimbatore MGR Mandi / Erode"
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Goods Weight in Kilograms */}
              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Weight className="w-3.5 h-3.5 text-amber-600" />
                  <span>Goods Weight (kg)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={goodsWeightKg}
                  onChange={(e) => setGoodsWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 50 (kg payload)"
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:border-emerald-500 font-bold text-emerald-900"
                />
              </div>

              {/* Search Vehicles Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Vehicles</span>
                </button>
              </div>
            </div>

            {goodsWeightKg && Number(goodsWeightKg) > 0 && (
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Filtering for vehicles verified to carry at least {goodsWeightKg} kg safely.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setGoodsWeightKg('');
                    setPickupSearch('');
                    setDeliverySearch('');
                    fetchTransport();
                  }}
                  className="text-stone-400 hover:text-stone-700 underline"
                >
                  Clear search filters
                </button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* VIEW 1: BROWSE VEHICLES & CATEGORIES */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* SECTION B: VEHICLE CATEGORIES (7 SPECIFIC CATEGORIES) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                Choose Vehicle Category
              </h2>
              <span className="text-xs text-stone-500">
                Indicative ranges; verified payload shown per vehicle card
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {VEHICLE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between group overflow-hidden ${
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
                          (e.target as HTMLImageElement).src = '/vehicles/bike.jpg';
                        }}
                      />
                    </div>
                    <div>
                      <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                        {cat.name}
                      </div>
                      <div className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-emerald-700'}`}>
                        {cat.range}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION C: VEHICLE CARDS GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-700">
                Available Transport Vehicles ({transportList.length})
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
            ) : transportList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
                <Truck className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="text-base font-bold text-stone-800">No suitable transport vehicles found</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  {goodsWeightKg
                    ? `No vehicles currently registered with verified payload for ${goodsWeightKg} kg in this area.`
                    : 'Try clearing your location or category filters to view other available vehicles.'}
                </p>
                <button
                  onClick={() => {
                    setPickupSearch('');
                    setDeliverySearch('');
                    setGoodsWeightKg('');
                    setSelectedCategory('All');
                    fetchTransport();
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {transportList.map((t) => (
                  <TransportCard
                    key={t._id}
                    transport={t}
                    onRequest={handleOpenBooking}
                    onViewDetails={(vehicle) => setDetailsVehicle(vehicle)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: CUSTOMER'S TRANSPORT BOOKINGS TAB */}
      {activeTab === 'my_bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">My Transport Bookings</h2>
              <p className="text-xs text-stone-500">
                Track live status, driver details, and manage cancellations for your agricultural freight requests.
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
              <FileText className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-sm font-bold text-stone-700">No transport bookings placed yet</h3>
              <p className="text-xs text-stone-500">
                Browse our vehicle fleet and book a delivery bike, TVS XL, or loading auto for your produce.
              </p>
              <button
                onClick={() => setActiveTab('browse')}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Browse Available Vehicles
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.map((b) => {
                const canCancel = ['pending', 'accepted'].includes(b.status);
                return (
                  <div
                    key={b._id}
                    className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <div className="text-sm font-bold text-stone-900">
                          {b.vehicleName || 'Agri Transport Vehicle'}
                        </div>
                        <div className="text-xs text-stone-500 font-mono">
                          Reg No: {b.vehicleNumber || 'Pending'} • Booking ID: {b._id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStatusBadge(b.status)}
                        <span className="text-sm font-extrabold text-emerald-700">
                          {b.estimatedOrQuotedPrice > 0
                            ? formatINR(b.estimatedOrQuotedPrice)
                            : 'Quotation Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Route & Cargo details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[11px]">Pickup Location</span>
                        <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {b.pickupAddress}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Delivery Location</span>
                        <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          {b.deliveryAddress}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">Cargo & Verified Weight</span>
                        <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                          <Weight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          {b.cargoType} ({b.cargoWeightKg || (b.cargoWeightTonnes ? b.cargoWeightTonnes * 1000 : 0)} kg)
                        </span>
                      </div>
                    </div>

                    {/* Driver & Schedule Info */}
                    <div className="p-3 bg-stone-50 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-4 text-stone-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          {new Date(b.scheduledDate || b.createdAt || '').toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {b.pickupTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            {b.pickupTime}
                          </span>
                        )}
                        {b.driverInfo?.name && (
                          <span className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-md">
                            <UserIcon className="w-3 h-3 text-emerald-700" />
                            Driver: {b.driverInfo.name} ({b.driverInfo.phone})
                          </span>
                        )}
                      </div>

                      {canCancel && (
                        <button
                          type="button"
                          disabled={cancellingId === b._id}
                          onClick={() => handleCancelBooking(b._id)}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          {cancellingId === b._id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {detailsVehicle && (
        <Modal
          isOpen={!!detailsVehicle}
          onClose={() => setDetailsVehicle(null)}
          title={`Vehicle Specification: ${detailsVehicle.vehicleName || detailsVehicle.vehicleNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="aspect-16/9 bg-stone-100 rounded-xl overflow-hidden relative">
              <img
                src={getVehicleImage(detailsVehicle.vehicleType, detailsVehicle.images)}
                alt={detailsVehicle.vehicleNumber}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getVehicleImage(detailsVehicle.vehicleType);
                }}
              />
              <div className="absolute top-2 left-2">
                <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                  {getVehicleCategoryLabel(detailsVehicle.vehicleType)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[11px] text-stone-500">Verified Payload Capacity</div>
                <div className="text-base font-bold text-emerald-800">
                  {detailsVehicle.carryingCapacityKg} kg Max
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[11px] text-stone-500">Pricing Model</div>
                <div className="text-base font-bold text-stone-900">
                  {detailsVehicle.pricingModel === 'per_km'
                    ? `${formatINR(detailsVehicle.baseRate)} / km`
                    : detailsVehicle.pricingModel === 'per_trip'
                    ? `${formatINR(detailsVehicle.baseRate)} / trip`
                    : 'Quotation'}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-stone-800">Vehicle Description & Usage</span>
              <p className="text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                {detailsVehicle.description || 'Verified agricultural carrier compliant with local goods transport regulations.'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-stone-800">Operating Route & Hubs</span>
              <div className="text-stone-600">
                Hub: {detailsVehicle.pickupLocation.town || detailsVehicle.pickupLocation.district}, {detailsVehicle.pickupLocation.state}
              </div>
              <div className="text-stone-500 text-[11px]">
                Routes: {detailsVehicle.serviceAreas.join(', ')}
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 block">Transport Provider</span>
                <span className="font-bold text-emerald-950 text-sm">{detailsVehicle.providerName}</span>
              </div>
              {detailsVehicle.providerPhone && (
                <a
                  href={`tel:${detailsVehicle.providerPhone}`}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Provider</span>
                </a>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDetailsVehicle(null)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleOpenBooking(detailsVehicle)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1"
              >
                <span>Book This Vehicle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* SECTION D & E: BOOKING FORM MODAL & PRICE CALCULATION */}
      {bookingVehicle && (
        <Modal
          isOpen={!!bookingVehicle}
          onClose={() => setBookingVehicle(null)}
          title={`Book Transport: ${bookingVehicle.vehicleName || bookingVehicle.vehicleNumber}`}
        >
          {bookingSuccess ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-stone-900">Booking Request Placed!</h4>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">{bookingSuccess}</p>
              <div className="text-[11px] text-stone-400">Redirecting to your bookings tab...</div>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              {/* Vehicle & Capacity Summary Banner */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-emerald-800 font-semibold">
                    {getVehicleCategoryLabel(bookingVehicle.vehicleType)}
                  </div>
                  <div className="text-sm font-bold text-emerald-950">
                    Verified Payload: {bookingVehicle.carryingCapacityKg} kg Max
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-stone-500">Registration</div>
                  <div className="font-mono font-bold text-stone-800">{bookingVehicle.vehicleNumber}</div>
                </div>
              </div>

              {bookingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Customer Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Customer / Farmer Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Murugan Selvam"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Contact Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98421 11223"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
                  />
                </div>
              </div>

              {/* Pickup & Delivery Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Pickup Location / Farm Gate</label>
                  <input
                    type="text"
                    required
                    value={formPickupLocation}
                    onChange={(e) => setFormPickupLocation(e.target.value)}
                    placeholder="e.g. Thondamuthur Village Field Gate"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Delivery Destination / Mandi</label>
                  <input
                    type="text"
                    required
                    value={formDeliveryLocation}
                    onChange={(e) => setFormDeliveryLocation(e.target.value)}
                    placeholder="e.g. MGR Wholesale Vegetable Mandi, Coimbatore"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
                  />
                </div>
              </div>

              {/* Goods Description & Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-bold mb-1">Goods Description</label>
                  <input
                    type="text"
                    required
                    value={goodsDescription}
                    onChange={(e) => setGoodsDescription(e.target.value)}
                    placeholder="e.g. 3 plastic crates of organic tomatoes"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Goods Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formWeightKg}
                    onChange={(e) => setFormWeightKg(Number(e.target.value))}
                    className={`w-full p-2.5 border rounded-xl bg-stone-50 font-extrabold ${
                      isOverweight ? 'border-rose-400 text-rose-700 bg-rose-50/50' : 'border-stone-200 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              {/* Strict payload warning if overweight */}
              {isOverweight && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 flex items-start gap-2">
                  <XCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold">Overweight Warning: </span>
                    Requested weight ({formWeightKg} kg) exceeds vehicle verified capacity ({bookingVehicle.carryingCapacityKg} kg). Please lower the weight or select a vehicle from a higher category (e.g. Mini Cargo 3-Wheeler or Tata Ace).
                  </div>
                </div>
              )}

              {/* Date & Time of Pickup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Preferred Pickup Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Preferred Pickup Time</label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-800 font-medium"
                  >
                    <option value="06:00 AM">06:00 AM (Early Mandi Transit)</option>
                    <option value="07:30 AM">07:30 AM (Morning Transit)</option>
                    <option value="09:00 AM">09:00 AM (Standard Morning)</option>
                    <option value="11:30 AM">11:30 AM (Mid-Day)</option>
                    <option value="02:30 PM">02:30 PM (Afternoon)</option>
                    <option value="05:00 PM">05:00 PM (Evening Mandi Auction)</option>
                    <option value="07:00 PM">07:00 PM (Night Transit)</option>
                  </select>
                </div>
              </div>

              {bookingVehicle.pricingModel === 'per_km' && (
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    Estimated Transit Distance (Kilometres)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={estimatedKm}
                    onChange={(e) => setEstimatedKm(Number(e.target.value))}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
                  />
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Special Handling Instructions</label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Fragile produce crates. Please carry tarpaulin cover for rain protection."
                  className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50 text-xs"
                />
              </div>

              {/* SECTION E: TRANSPORT PRICE CALCULATION BREAKDOWN */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                <div className="font-bold text-stone-800 text-xs flex items-center justify-between">
                  <span>Transparent Price Calculation</span>
                  <span className="text-[10px] text-stone-500 font-normal">All in Indian Rupees (₹ INR)</span>
                </div>

                {priceCalc?.isQuotation ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      <strong>Custom Quotation Required:</strong> Final price will be quoted by provider based on route terrain and road tolls.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1 pt-1 text-xs text-stone-600 border-t border-stone-200">
                    <div className="flex justify-between">
                      <span>Vehicle Charge ({bookingVehicle.pricingModel === 'per_km' ? `${formatINR(bookingVehicle.baseRate)} × ${estimatedKm} km` : 'Per Trip Base Rate'}):</span>
                      <span className="font-semibold text-stone-800">{formatINR(priceCalc?.vehicleCharge || 0)}</span>
                    </div>

                    {priceCalc?.additionalCharges ? (
                      <div className="flex justify-between">
                        <span>Configured Handling & Toll Charges:</span>
                        <span className="font-semibold text-stone-800">{formatINR(priceCalc.additionalCharges)}</span>
                      </div>
                    ) : null}

                    <div className="flex justify-between pt-1 border-t border-stone-200 font-extrabold text-sm text-emerald-900">
                      <span>Estimated Total (INR):</span>
                      <span>{formatINR(priceCalc?.total || 0)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setBookingVehicle(null)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking || isOverweight}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  {submittingBooking ? 'Submitting...' : 'Confirm Transport Booking'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
