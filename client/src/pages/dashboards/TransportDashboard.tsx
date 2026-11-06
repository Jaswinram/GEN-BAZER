import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  PlusCircle,
  MapPin,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Weight,
  TrendingUp,
  Clock,
  Search,
  RefreshCw,
  Phone,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import api from '../../services/api';
import { TransportListing, TransportBooking } from '../../types';
import { formatINR } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { getVehicleCategoryLabel, getVehicleImage } from '../../components/TransportCard';
import { DashboardLayout, DashboardNavItem } from '../../components/DashboardLayout';
import { DashboardStatCard } from '../../components/DashboardStatCard';
import { RevenueBarChart, DistributionCard } from '../../components/DashboardCharts';

export const TransportDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [vehicles, setVehicles] = useState<TransportListing[]>([]);
  const [requests, setRequests] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Vehicle Registration Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState('moped_carrier');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [carryingCapacityKg, setCarryingCapacityKg] = useState<number | ''>(60);
  const [pricingModel, setPricingModel] = useState('per_trip');
  const [baseRate, setBaseRate] = useState<number | ''>(180);
  const [additionalCharges, setAdditionalCharges] = useState<number | ''>(20);
  const [town, setTown] = useState('Kinathukadavu Hub');
  const [serviceAreas, setServiceAreas] = useState('Coimbatore, Pollachi, Kinathukadavu');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quote Modal
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<TransportBooking | null>(null);
  const [quotedPrice, setQuotedPrice] = useState<number | ''>('');
  const [providerNotes, setProviderNotes] = useState('');

  // Driver Assignment Modal
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  const fetchData = async () => {
    try {
      const [transRes, reqRes] = await Promise.all([
        api.get('/transport'),
        api.get('/transport/requests/provider'),
      ]);
      if (transRes.data?.success) {
        setVehicles(transRes.data.transport.filter((t: TransportListing) => t.providerId === user?._id));
      }
      if (reqRes.data?.success) {
        setRequests(reqRes.data.requests);
      }
    } catch (err) {
      console.error('Failed to load transport dashboard:', err);
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

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/transport', {
        vehicleName,
        vehicleType,
        vehicleNumber,
        carryingCapacityKg: Number(carryingCapacityKg),
        pricingModel,
        baseRate: Number(baseRate),
        additionalCharges: Number(additionalCharges || 0),
        pickupLocation: {
          town,
          district: user?.location?.district || 'Coimbatore',
          state: user?.location?.state || 'Tamil Nadu',
        },
        serviceAreas: serviceAreas.split(',').map((s) => s.trim()),
        images: [`/vehicles/${vehicleType}.jpg`],
        description,
      });

      if (res.data?.success) {
        setVehicles([res.data.transport, ...vehicles]);
        setModalOpen(false);
        setVehicleNumber('');
        setVehicleName('');
        setDescription('');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to register vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: string, driverInfo?: any) => {
    try {
      const payload: any = { status };
      if (driverInfo) payload.driverInfo = driverInfo;
      const res = await api.patch(`/transport/requests/${requestId}`, payload);
      if (res.data?.success) {
        setRequests(requests.map((r) => (r._id === requestId ? res.data.booking : r)));
        setDriverModalOpen(false);
        setActiveRequest(null);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    try {
      const res = await api.patch(`/transport/requests/${activeRequest._id}`, {
        quotedPrice: Number(quotedPrice),
        providerNotes,
      });
      if (res.data?.success) {
        setRequests(requests.map((r) => (r._id === activeRequest._id ? res.data.booking : r)));
        setQuoteModalOpen(false);
        setActiveRequest(null);
      }
    } catch (err) {
      console.error('Failed to quote:', err);
    }
  };

  const handleAssignDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    handleStatusUpdate(activeRequest._id, 'driver_assigned', {
      name: driverName.trim(),
      phone: driverPhone.trim(),
    });
  };

  // Metrics
  const totalVehicles = vehicles.length;
  const newRequests = requests.filter((r) => r.status === 'pending').length;
  const activeDeliveries = requests.filter((r) =>
    ['driver_assigned', 'pickup_completed', 'in_transit', 'accepted'].includes(r.status)
  ).length;
  const completedDeliveries = requests.filter((r) => r.status === 'delivered').length;
  const totalEarningsINR = requests
    .filter((r) => r.status === 'delivered')
    .reduce((sum, r) => sum + (r.estimatedOrQuotedPrice || 0), 0);

  // Distribution by vehicle type
  const vehicleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach((v) => {
      const label = getVehicleCategoryLabel(v.vehicleType);
      counts[label] = (counts[label] || 0) + 1;
    });
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-teal-500'];
    const total = vehicles.length || 1;
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      value: count,
      color: colors[idx % colors.length],
      percentage: Math.round((count / total) * 100),
    }));
  }, [vehicles]);

  // Freight Revenue trend
  const freightTrendData = useMemo(() => {
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    return months.map((m, idx) => {
      const amount = (totalEarningsINR / 6) * (0.6 + idx * 0.16);
      return {
        label: m,
        value: Math.round(amount),
      };
    });
  }, [totalEarningsINR]);

  const navItems: DashboardNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'fleet', label: 'Vehicle Fleet', icon: Truck, badge: totalVehicles },
    {
      id: 'dispatches',
      label: 'Freight Dispatches',
      icon: Navigation,
      badge: newRequests > 0 ? newRequests : undefined,
      badgeVariant: 'amber',
    },
  ];

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.pickupAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.cargoType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.specialInstructions || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        statusFilter === 'All' || r.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [requests, searchQuery, statusFilter]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      return (
        (v.vehicleName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vehicleType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [vehicles, searchQuery]);

  return (
    <DashboardLayout
      roleTitle="Transport & Freight Hub"
      roleBadge="Logistics Partner"
      roleBadgeColor="bg-emerald-100 text-emerald-800"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      navItems={navItems}
      searchPlaceholder="Search routes, farmers, vehicle numbers..."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
            title="Refresh freight desk"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Vehicle</span>
          </button>
        </div>
      }
    >
      {/* ======================= OVERVIEW TAB ======================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs mb-3">
                {user?.farmOrBusinessName || 'Agri Transport Provider'} • {user?.location?.district || 'Tamil Nadu'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Farm-to-Mandi Freight Logistics.
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed">
                Connect your mopeds, auto-pickups, mini trucks, and heavy carriers with local farmers. Deliver fresh harvests straight to APMC mandis and retail warehouses with verified digital waybills.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 bg-white text-emerald-950 font-bold text-xs rounded-xl hover:bg-emerald-50 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-700" />
                  <span>Add Vehicle to Fleet</span>
                </button>
                <button
                  onClick={() => setActiveTab('dispatches')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4" />
                  <span>Pending Dispatches ({newRequests})</span>
                </button>
              </div>
            </div>
            <Truck className="absolute -right-6 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
          </div>

          {/* 4 Core Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <DashboardStatCard
              title="Registered Vehicles"
              value={totalVehicles}
              icon={Truck}
              iconColor="text-blue-700"
              iconBg="bg-blue-100"
              trend={{ value: 12.0, isPositive: true, label: 'ready for dispatch' }}
              actionLabel="View fleet"
              onAction={() => setActiveTab('fleet')}
            />
            <DashboardStatCard
              title="New Transit Requests"
              value={newRequests}
              icon={Clock}
              iconColor="text-amber-700"
              iconBg="bg-amber-100"
              trend={
                newRequests > 0
                  ? { value: newRequests, isPositive: false, label: 'needs quote / acceptance' }
                  : undefined
              }
              actionLabel="Dispatch requests"
              onAction={() => setActiveTab('dispatches')}
            />
            <DashboardStatCard
              title="Active Deliveries"
              value={activeDeliveries}
              icon={Navigation}
              iconColor="text-teal-700"
              iconBg="bg-teal-100"
              subtitle="Consignments in transit"
            />
            <DashboardStatCard
              title="Freight Earnings (INR)"
              value={formatINR(totalEarningsINR)}
              icon={TrendingUp}
              iconColor="text-emerald-800"
              iconBg="bg-emerald-100"
              trend={{ value: 19.5, isPositive: true, label: 'vs last month' }}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <RevenueBarChart
                title="Freight & Dispatch Earnings"
                subtitle="Monthly freight receipts from farm pickups (INR)"
                data={freightTrendData}
                unit="₹"
              />
            </div>
            <div>
              <DistributionCard
                title="Fleet Category Mix"
                subtitle="Distribution of registered vehicles"
                totalCount={totalVehicles}
                totalLabel="Total Vehicles"
                items={
                  vehicleDistribution.length > 0
                    ? vehicleDistribution
                    : [{ name: 'No vehicles yet', value: 0, color: 'bg-stone-300', percentage: 100 }]
                }
              />
            </div>
          </div>

          {/* Recent Transit Requests Table */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">Recent Transit Requests</h3>
                <p className="text-xs text-stone-500">Farm-to-mandi pickup and delivery dispatches</p>
              </div>
              <button
                onClick={() => setActiveTab('dispatches')}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>View All ({requests.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-xs">
                No transport requests received yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Farmer / Requester</th>
                      <th className="py-2.5 px-3">Pickup & Delivery Route</th>
                      <th className="py-2.5 px-3">Cargo Weight</th>
                      <th className="py-2.5 px-3 text-right">Freight Rate</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {requests.slice(0, 5).map((r) => {
                      const weightKg = r.cargoWeightKg || (r.cargoWeightTonnes ? r.cargoWeightTonnes * 1000 : 0);
                      return (
                        <tr key={r._id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-stone-900">{r.requesterName}</div>
                            <div className="text-[10px] text-stone-400">{r.requesterPhone}</div>
                          </td>
                          <td className="py-3 px-3 text-stone-700 max-w-[200px]">
                            <div className="truncate"><strong className="text-stone-900">From:</strong> {r.pickupAddress}</div>
                            <div className="truncate"><strong className="text-stone-900">To:</strong> {r.deliveryAddress}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-stone-800">{weightKg} kg</span>
                            <div className="text-[10px] text-stone-400 truncate max-w-[120px]">{r.cargoType || 'Agri Cargo'}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-emerald-800">
                            {formatINR(r.estimatedOrQuotedPrice || 0)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge
                              variant={
                                r.status === 'delivered'
                                  ? 'green'
                                  : r.status === 'in_transit' || r.status === 'driver_assigned'
                                  ? 'blue'
                                  : r.status === 'pending'
                                  ? 'amber'
                                  : 'gray'
                              }
                              size="sm"
                            >
                              {r.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {r.status === 'pending' && (
                              <button
                                onClick={() => {
                                  setActiveRequest(r);
                                  setQuotedPrice(r.estimatedOrQuotedPrice || '');
                                  setQuoteModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                              >
                                Send Quote
                              </button>
                            )}
                            {r.status === 'accepted' && (
                              <button
                                onClick={() => {
                                  setActiveRequest(r);
                                  setDriverModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold"
                              >
                                Assign Driver
                              </button>
                            )}
                            {r.status === 'in_transit' && (
                              <button
                                onClick={() => handleStatusUpdate(r._id, 'delivered')}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold"
                              >
                                Delivered
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
              <h2 className="text-lg font-bold text-stone-900">Vehicle Fleet ({vehicles.length})</h2>
              <p className="text-xs text-stone-500">Manage registered transport carriers and coverage zones</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register Vehicle</span>
            </button>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 text-xs">
              <Truck className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <p className="font-semibold text-stone-600 text-sm">No vehicles registered</p>
              <p className="mt-1">Add your mopeds, mini-trucks, or trailers to receive dispatch orders.</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register First Vehicle</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVehicles.map((v) => (
                <div
                  key={v._id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-16/10 bg-stone-100 overflow-hidden">
                      <img
                        src={getVehicleImage(v.vehicleType, v.images)}
                        alt={v.vehicleName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/vehicles/mini_truck.jpg';
                        }}
                      />
                      <span className="absolute top-2 left-2 text-[10px] font-bold text-blue-900 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs">
                        {getVehicleCategoryLabel(v.vehicleType)}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-stone-900 text-sm">{v.vehicleName}</h3>
                        <span className="font-mono text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                          {v.vehicleNumber}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2">{v.description}</p>

                      <div className="space-y-1 pt-1 text-[11px] text-stone-600">
                        <div className="flex items-center gap-1.5">
                          <Weight className="w-3.5 h-3.5 text-stone-400" />
                          <span>Payload Capacity: <strong>{v.carryingCapacityKg} kg</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>Service Areas: <strong>{v.serviceAreas?.join(', ') || 'District wide'}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <div className="font-black text-emerald-800 text-sm">
                        {formatINR(v.baseRate)} <span className="text-xs font-normal text-stone-500">/ {v.pricingModel.replace('_', ' ')}</span>
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Status: <strong className={v.availabilityStatus === 'available' ? 'text-emerald-700' : 'text-stone-500'}>
                          {v.availabilityStatus === 'available' ? 'Ready for Dispatch' : 'On Route'}
                        </strong>
                      </div>
                    </div>
                    <Badge variant={v.availabilityStatus === 'available' ? 'green' : 'gray'} size="sm">
                      {v.availabilityStatus === 'available' ? 'Available' : 'Busy'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= DISPATCHES TAB ======================= */}
      {activeTab === 'dispatches' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Freight Dispatches ({requests.length})</h2>
              <p className="text-xs text-stone-500">Track all transit requests, driver assignments, and completed runs</p>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Pending', 'Accepted', 'In_Transit', 'Delivered', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === status
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                No dispatch orders match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] bg-stone-50">
                      <th className="py-3 px-4">Requester / Farmer</th>
                      <th className="py-3 px-4">Route (Origin → Dest)</th>
                      <th className="py-3 px-4">Cargo & Weight</th>
                      <th className="py-3 px-4 text-right">Freight Rate</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredRequests.map((r) => {
                      const weightKg = r.cargoWeightKg || (r.cargoWeightTonnes ? r.cargoWeightTonnes * 1000 : 0);
                      return (
                        <tr key={r._id} className="hover:bg-stone-50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-stone-900">{r.requesterName}</div>
                            <div className="text-[10px] text-stone-400">{r.requesterPhone}</div>
                            {r.driverInfo?.name && (
                              <div className="text-[10px] text-blue-700 font-medium mt-1">
                                Driver: {r.driverInfo.name} ({r.driverInfo.phone})
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-stone-700 max-w-[220px]">
                            <div><strong className="text-stone-900">From:</strong> {r.pickupAddress}</div>
                            <div><strong className="text-stone-900">To:</strong> {r.deliveryAddress}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-stone-900">{weightKg} kg</span>
                            <div className="text-[10px] text-stone-400">{r.cargoType || 'Agri Cargo'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-emerald-800 text-sm">
                            {formatINR(r.estimatedOrQuotedPrice || 0)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Badge
                              variant={
                                r.status === 'delivered'
                                  ? 'green'
                                  : r.status === 'in_transit' || r.status === 'driver_assigned'
                                  ? 'blue'
                                  : r.status === 'pending'
                                  ? 'amber'
                                  : 'gray'
                              }
                              size="sm"
                            >
                              {r.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {r.status === 'pending' && (
                                <button
                                  onClick={() => {
                                    setActiveRequest(r);
                                    setQuotedPrice(r.estimatedOrQuotedPrice || '');
                                    setQuoteModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  Quote Rate
                                </button>
                              )}
                              {r.status === 'accepted' && (
                                <button
                                  onClick={() => {
                                    setActiveRequest(r);
                                    setDriverModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  Assign Driver
                                </button>
                              )}
                              {r.status === 'driver_assigned' && (
                                <button
                                  onClick={() => handleStatusUpdate(r._id, 'in_transit')}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  Start Transit
                                </button>
                              )}
                              {r.status === 'in_transit' && (
                                <button
                                  onClick={() => handleStatusUpdate(r._id, 'delivered')}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                  Mark Delivered
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= VEHICLE REGISTRATION MODAL ======================= */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register Vehicle into Logistics Network"
        maxWidth="lg"
      >
        <form onSubmit={handleRegisterVehicle} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Vehicle Name / Make</label>
              <input
                type="text"
                required
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                placeholder="e.g. Tata Ace Gold Diesel"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Registration Plate</label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="TN 38 CD 4821"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 uppercase font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              >
                <option value="moped_carrier">Moped / Bike with Carrier</option>
                <option value="auto_carrier">Auto Rickshaw / 3-Wheeler</option>
                <option value="mini_truck">Mini Truck (Tata Ace / Dost)</option>
                <option value="pickup">Pickup Truck (Bolero Maxi)</option>
                <option value="heavy_truck">Heavy Truck (6/10-Wheeler)</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Payload Capacity (KG)</label>
              <input
                type="number"
                min={10}
                required
                value={carryingCapacityKg}
                onChange={(e) => setCarryingCapacityKg(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="750"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Pricing Model</label>
              <select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value)}
                className="w-full p-2 border border-stone-200 rounded-xl bg-white"
              >
                <option value="per_trip">Per Trip</option>
                <option value="per_km">Per KM</option>
                <option value="per_tonne_km">Per Tonne / KM</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Base Rate (₹ / INR)</label>
              <input
                type="number"
                min={50}
                required
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="250"
                className="w-full p-2 border border-stone-200 rounded-xl bg-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Covered Service Areas (Comma Separated)</label>
            <input
              type="text"
              value={serviceAreas}
              onChange={(e) => setServiceAreas(e.target.value)}
              placeholder="e.g. Pollachi, Kinathukadavu, Coimbatore Mandi"
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Vehicle Description / Loading Features</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tarpaulin protection, hydraulic tipping, refrigerated compartment, fast turnaround..."
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
          >
            {submitting ? 'Registering...' : 'Register Vehicle to Fleet'}
          </button>
        </form>
      </Modal>

      {/* ======================= QUOTE MODAL ======================= */}
      <Modal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        title={`Send Freight Rate Quote - ${activeRequest?.requesterName}`}
        maxWidth="md"
      >
        <form onSubmit={handleSendQuote} className="space-y-4 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">Quoted Freight Price (₹ / INR)</label>
            <input
              type="number"
              min={50}
              required
              value={quotedPrice}
              onChange={(e) => setQuotedPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 850"
              className="w-full p-2.5 border border-stone-200 rounded-xl font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Notes / Terms for Farmer</label>
            <textarea
              rows={3}
              value={providerNotes}
              onChange={(e) => setProviderNotes(e.target.value)}
              placeholder="e.g. Loading included, arrival within 45 mins, toll charges extra..."
              className="w-full p-2.5 border border-stone-200 rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
          >
            Send Official Quote
          </button>
        </form>
      </Modal>

      {/* ======================= ASSIGN DRIVER MODAL ======================= */}
      <Modal
        isOpen={driverModalOpen}
        onClose={() => setDriverModalOpen(false)}
        title="Assign Driver & Vehicle"
        maxWidth="md"
      >
        <form onSubmit={handleAssignDriver} className="space-y-4 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">Driver Full Name</label>
            <input
              type="text"
              required
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="e.g. M. Murugesan"
              className="w-full p-2.5 border border-stone-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Driver Mobile Number</label>
            <input
              type="tel"
              required
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              placeholder="e.g. 9842100000"
              className="w-full p-2.5 border border-stone-200 rounded-xl font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
          >
            Confirm & Dispatch
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
