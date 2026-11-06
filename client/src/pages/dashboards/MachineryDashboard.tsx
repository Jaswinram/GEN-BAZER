import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  PlusCircle,
  Calendar,
  Check,
  X,
  AlertCircle,
  Clock,
  TrendingUp,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  MapPin,
  Fuel,
  Gauge,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import { MachineryListing, MachineryBooking } from '../../types';
import { formatINR } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { getMachineryTypeLabel, getMachineryImage } from '../../components/MachineryCard';
import { DashboardLayout, DashboardNavItem } from '../../components/DashboardLayout';
import { DashboardStatCard } from '../../components/DashboardStatCard';
import { RevenueBarChart, DistributionCard } from '../../components/DashboardCharts';

export const MachineryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [machinery, setMachinery] = useState<MachineryListing[]>([]);
  const [bookings, setBookings] = useState<MachineryBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingFilter, setBookingFilter] = useState('All');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [machineryType, setMachineryType] = useState('tractor');
  const [rentalPrice, setRentalPrice] = useState<number | ''>(850);
  const [rentalUnit, setRentalUnit] = useState('hour');
  const [horsepower, setHorsepower] = useState('45 HP');
  const [fuelType, setFuelType] = useState('Diesel');
  const [town, setTown] = useState('Palladam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [machRes, bookRes] = await Promise.all([
        api.get('/machinery'),
        api.get('/machinery/bookings/owner'),
      ]);
      if (machRes.data?.success) {
        setMachinery(machRes.data.machinery.filter((m: MachineryListing) => m.ownerId === user?._id));
      }
      if (bookRes.data?.success) {
        setBookings(bookRes.data.bookings);
      }
    } catch (err) {
      console.error('Failed to load machinery dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCreateMachinery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/machinery', {
        title,
        machineryType,
        rentalPrice: Number(rentalPrice),
        rentalUnit,
        specifications: { horsepower, fuelType },
        location: {
          town,
          district: user?.location?.district || 'Tiruppur',
          state: user?.location?.state || 'Tamil Nadu',
        },
        images: [`/machinery/${machineryType}.jpg`],
        description,
      });

      if (res.data?.success) {
        setMachinery([res.data.machinery, ...machinery]);
        setModalOpen(false);
        setTitle('');
        setDescription('');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to list machinery.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingStatus = async (bookingId: string, status: string) => {
    try {
      const res = await api.patch(`/machinery/bookings/${bookingId}/status`, { status });
      if (res.data?.success) {
        setBookings(bookings.map((b) => (b._id === bookingId ? res.data.booking : b)));
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  // Metrics
  const totalMachinery = machinery.length;
  const availableMachinery = machinery.filter((m) => m.availabilityStatus === 'available').length;
  const activeRentals = bookings.filter((b) => b.status === 'accepted').length;
  const pendingRequests = bookings.filter((b) => b.status === 'pending').length;
  const totalEarningsINR = bookings
    .filter((b) => b.status === 'accepted' || b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Machinery Type Distribution
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    machinery.forEach((m) => {
      const label = getMachineryTypeLabel(m.machineryType);
      counts[label] = (counts[label] || 0) + 1;
    });
    const colors = ['bg-amber-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-rose-500'];
    const total = machinery.length || 1;
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      value: count,
      color: colors[idx % colors.length],
      percentage: Math.round((count / total) * 100),
    }));
  }, [machinery]);

  // Earnings trend
  const earningsTrendData = useMemo(() => {
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    return months.map((m, idx) => {
      const amount = (totalEarningsINR / 6) * (0.6 + idx * 0.15);
      return {
        label: m,
        value: Math.round(amount),
      };
    });
  }, [totalEarningsINR]);

  const navItems: DashboardNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'fleet', label: 'My Fleet', icon: Wrench, badge: totalMachinery },
    {
      id: 'bookings',
      label: 'Rental Bookings',
      icon: Clock,
      badge: pendingRequests > 0 ? pendingRequests : undefined,
      badgeVariant: 'amber',
    },
    { id: 'calendar', label: 'Rental Calendar', icon: Calendar },
  ];

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.machineryTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.renterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookingLocation?.district?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        bookingFilter === 'All' || b.status.toLowerCase() === bookingFilter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [bookings, searchQuery, bookingFilter]);

  const filteredMachinery = useMemo(() => {
    return machinery.filter((m) => {
      return (
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.machineryType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.location?.town?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [machinery, searchQuery]);

  return (
    <DashboardLayout
      roleTitle="Machinery Owner Hub"
      roleBadge="Fleet Operator"
      roleBadgeColor="bg-amber-100 text-amber-800"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      navItems={navItems}
      searchPlaceholder="Search machines, renters, locations..."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
            title="Refresh fleet"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Machine to Fleet</span>
          </button>
        </div>
      }
    >
      {/* ======================= OVERVIEW TAB ======================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs mb-3">
                {user?.farmOrBusinessName || 'Farm Mechanization Fleet'} • {user?.location?.district || 'Tamil Nadu'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Maximize Tractor & Equipment Utilization.
              </h1>
              <p className="text-xs sm:text-sm text-amber-100 mt-2 leading-relaxed">
                Connect idle farm machines with nearby farmers during peak tilling, spraying, and harvesting seasons. Earn secure rental payouts with transparent per-hour or per-acre rates.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 bg-white text-amber-950 font-bold text-xs rounded-xl hover:bg-amber-50 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-amber-700" />
                  <span>List New Machinery</span>
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4" />
                  <span>Pending Requests ({pendingRequests})</span>
                </button>
              </div>
            </div>
            <Wrench className="absolute -right-6 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
          </div>

          {/* 4 Core Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <DashboardStatCard
              title="Total Machinery"
              value={totalMachinery}
              icon={Wrench}
              iconColor="text-amber-700"
              iconBg="bg-amber-100"
              trend={{ value: 16.5, isPositive: true, label: 'vs last season' }}
              actionLabel="View all fleet"
              onAction={() => setActiveTab('fleet')}
            />
            <DashboardStatCard
              title="Available Machinery"
              value={availableMachinery}
              icon={CheckCircle2}
              iconColor="text-emerald-700"
              iconBg="bg-emerald-100"
              subtitle={`${totalMachinery - availableMachinery} currently on rent / maintenance`}
            />
            <DashboardStatCard
              title="Active & Pending Rentals"
              value={activeRentals + pendingRequests}
              icon={Clock}
              iconColor="text-blue-700"
              iconBg="bg-blue-100"
              trend={
                pendingRequests > 0
                  ? { value: pendingRequests, isPositive: false, label: 'needs confirmation' }
                  : undefined
              }
              actionLabel="Manage requests"
              onAction={() => setActiveTab('bookings')}
            />
            <DashboardStatCard
              title="Rental Earnings (INR)"
              value={formatINR(totalEarningsINR)}
              icon={TrendingUp}
              iconColor="text-emerald-800"
              iconBg="bg-emerald-100"
              trend={{ value: 28.4, isPositive: true, label: 'peak season return' }}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <RevenueBarChart
                title="Machinery Rental Revenue"
                subtitle="Monthly earnings from equipment hire & tractor rentals (INR)"
                data={earningsTrendData}
                unit="₹"
              />
            </div>
            <div>
              <DistributionCard
                title="Fleet Composition"
                subtitle="Mix of tractors, harvesters, and tillers"
                totalCount={totalMachinery}
                totalLabel="Total Machines"
                items={
                  typeDistribution.length > 0
                    ? typeDistribution
                    : [{ name: 'No machines listed', value: 0, color: 'bg-stone-300', percentage: 100 }]
                }
              />
            </div>
          </div>

          {/* Recent Booking Requests */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">Recent Rental Requests</h3>
                <p className="text-xs text-stone-500">Incoming farm machine hire bookings from farmers</p>
              </div>
              <button
                onClick={() => setActiveTab('bookings')}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
              >
                <span>View All ({bookings.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-xs">
                No rental bookings received yet. Active machinery will appear in farmer searches.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Machinery</th>
                      <th className="py-2.5 px-3">Farmer / Renter</th>
                      <th className="py-2.5 px-3">Schedule</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3 text-right">Rental Total</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bookings.slice(0, 5).map((booking) => (
                      <tr key={booking._id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-stone-900">{booking.machineryTitle}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-stone-900">{booking.renterName}</div>
                          <div className="text-[10px] text-stone-400">{booking.renterPhone}</div>
                        </td>
                        <td className="py-3 px-3 text-stone-700">
                          <div>
                            {booking.durationUnits} {booking.unitType}s
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {new Date(booking.startDate).toLocaleDateString()} to{' '}
                            {new Date(booking.endDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-stone-600 max-w-[140px] truncate">
                          {booking.bookingLocation?.address || booking.bookingLocation?.district}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-emerald-800">
                          {formatINR(booking.totalAmount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge
                            variant={
                              booking.status === 'accepted'
                                ? 'green'
                                : booking.status === 'pending'
                                ? 'amber'
                                : booking.status === 'rejected'
                                ? 'red'
                                : 'gray'
                            }
                            size="sm"
                          >
                            {booking.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {booking.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleBookingStatus(booking._id, 'accepted')}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleBookingStatus(booking._id, 'rejected')}
                                className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          {booking.status === 'accepted' && (
                            <button
                              onClick={() => handleBookingStatus(booking._id, 'completed')}
                              className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-800 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= FLEET TAB ======================= */}
      {activeTab === 'fleet' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Machinery Fleet ({machinery.length})</h2>
              <p className="text-xs text-stone-500">Active tractors, harvesters, and implements available for hire</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Machine</span>
            </button>
          </div>

          {filteredMachinery.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 text-xs">
              <Wrench className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <p className="font-semibold text-stone-600 text-sm">No machinery listed in your fleet</p>
              <p className="mt-1">List your farm machinery to start earning per hour or acre.</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Machine to Fleet</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMachinery.map((m) => (
                <div
                  key={m._id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-16/10 bg-stone-100 overflow-hidden">
                      <img
                        src={getMachineryImage(m.machineryType, m.images)}
                        alt={m.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/machinery/tractor.jpg';
                        }}
                      />
                      <span className="absolute top-2 left-2 text-[10px] font-bold text-amber-900 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs">
                        {getMachineryTypeLabel(m.machineryType)}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-stone-900 text-sm">{m.title}</h3>
                      <p className="text-xs text-stone-500 line-clamp-2">{m.description}</p>

                      <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-1">
                        {m.specifications?.horsepower && (
                          <div className="flex items-center gap-1">
                            <Gauge className="w-3.5 h-3.5 text-stone-400" />
                            <span>{m.specifications.horsepower}</span>
                          </div>
                        )}
                        {m.specifications?.fuelType && (
                          <div className="flex items-center gap-1">
                            <Fuel className="w-3.5 h-3.5 text-stone-400" />
                            <span>{m.specifications.fuelType}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{m.location?.town || 'Local'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <div className="font-black text-emerald-800 text-sm">
                        {formatINR(m.rentalPrice)} <span className="text-xs font-normal text-stone-500">/ {m.rentalUnit}</span>
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Status: <strong className={m.availabilityStatus === 'available' ? 'text-emerald-700' : 'text-stone-500'}>
                          {m.availabilityStatus === 'available' ? 'Ready for Hire' : 'Unavailable'}
                        </strong>
                      </div>
                    </div>
                    <Badge variant={m.availabilityStatus === 'available' ? 'green' : 'gray'} size="sm">
                      {m.availabilityStatus === 'available' ? 'Available' : 'Booked'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= BOOKINGS TAB ======================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Rental Bookings ({bookings.length})</h2>
              <p className="text-xs text-stone-500">Manage all farmer hire requests, field schedules, and completions</p>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Pending', 'Accepted', 'Completed', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setBookingFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    bookingFilter === status
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                No bookings match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] bg-stone-50">
                      <th className="py-3 px-4">Machinery</th>
                      <th className="py-3 px-4">Renter / Farmer</th>
                      <th className="py-3 px-4">Duration & Schedule</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-right">Rental Total</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredBookings.map((b) => (
                      <tr key={b._id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-stone-900">{b.machineryTitle}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-900">{b.renterName}</div>
                          <div className="text-[10px] text-stone-400">{b.renterPhone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-stone-700">
                          <div className="font-semibold">
                            {b.durationUnits} {b.unitType}s
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {new Date(b.startDate).toLocaleDateString()} to {new Date(b.endDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          {b.bookingLocation?.address || b.bookingLocation?.district || 'Field site'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-800 text-sm">
                          {formatINR(b.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant={
                              b.status === 'accepted'
                                ? 'green'
                                : b.status === 'pending'
                                ? 'amber'
                                : b.status === 'completed'
                                ? 'green'
                                : 'red'
                            }
                            size="sm"
                          >
                            {b.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {b.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleBookingStatus(b._id, 'accepted')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleBookingStatus(b._id, 'rejected')}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {b.status === 'accepted' && (
                              <button
                                onClick={() => handleBookingStatus(b._id, 'completed')}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Mark Completed
                              </button>
                            )}
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
      )}

      {/* ======================= CALENDAR TAB ======================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Rental Calendar & Schedule</h2>
            <p className="text-xs text-stone-500">Upcoming machine deployment timeline across agricultural clusters</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            {bookings.filter((b) => b.status === 'accepted').length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                No active confirmed bookings on the calendar. Accepted requests will appear here.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings
                  .filter((b) => b.status === 'accepted')
                  .map((b) => (
                    <div
                      key={b._id}
                      className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-700" />
                          <span className="font-bold text-stone-900 text-xs">
                            {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="font-extrabold text-stone-900 text-sm">{b.machineryTitle}</div>
                        <div className="text-xs text-stone-600">
                          Renter: <strong>{b.renterName}</strong> ({b.renterPhone})
                        </div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{b.bookingLocation?.address || b.bookingLocation?.district}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          Confirmed
                        </span>
                        <div className="text-sm font-black text-emerald-800 mt-2">{formatINR(b.totalAmount)}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= ADD MACHINERY MODAL ======================= */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Agricultural Machinery to Fleet"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateMachinery} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Machine Title / Model</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mahindra 575 DI 45HP Tractor"
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Machinery Category</label>
              <select
                value={machineryType}
                onChange={(e) => setMachineryType(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              >
                <option value="tractor">Tractor</option>
                <option value="harvester">Harvester</option>
                <option value="rotavator">Rotavator / Tiller</option>
                <option value="power_tiller">Power Tiller</option>
                <option value="sprayer">Boom / Orchard Sprayer</option>
                <option value="thresher">Thresher</option>
                <option value="baler">Baler</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Hub Location (Town / Taluk)</label>
              <input
                type="text"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="e.g. Palladam"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Rental Rate (₹ / INR)</label>
              <input
                type="number"
                step="50"
                required
                min={100}
                value={rentalPrice}
                onChange={(e) => setRentalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="850"
                className="w-full p-2 border border-stone-200 rounded-xl bg-white font-bold"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Rental Billing Unit</label>
              <select
                value={rentalUnit}
                onChange={(e) => setRentalUnit(e.target.value)}
                className="w-full p-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="hour">per hour</option>
                <option value="day">per day</option>
                <option value="acre">per acre</option>
              </select>
            </div>
          </div>

          {/* Specifications */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Horsepower (HP)</label>
              <input
                type="text"
                value={horsepower}
                onChange={(e) => setHorsepower(e.target.value)}
                placeholder="45 HP"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              >
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric / Battery</option>
                <option value="Petrol">Petrol</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Equipment Description & Attachments</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Included implements (cultivator, 9-tyne, disc plough), driver included or dry-hire, maintenance state..."
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
          >
            {submitting ? 'Registering Machine...' : 'Publish Machinery Listing'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
