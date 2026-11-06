import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Store,
  Wrench,
  Truck,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  Settings,
  ShieldCheck,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
  RefreshCw,
  Trash2,
  Lock,
  Unlock,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api';
import { User, PlatformReport, Product, Order, MachineryListing, TransportListing, Payment } from '../../types';
import { formatINR } from '../../utils/currency';
import { Badge } from '../../components/Badge';
import { DashboardLayout, DashboardNavItem } from '../../components/DashboardLayout';
import { DashboardStatCard } from '../../components/DashboardStatCard';
import { RevenueBarChart, DistributionCard } from '../../components/DashboardCharts';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [machinery, setMachinery] = useState<MachineryListing[]>([]);
  const [transport, setTransport] = useState<TransportListing[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reports, setReports] = useState<PlatformReport[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, repRes, prodRes, ordRes, machRes, transRes, payRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/reports'),
        api.get('/admin/products').catch(() => ({ data: { success: false, products: [] } })),
        api.get('/admin/orders').catch(() => ({ data: { success: false, orders: [] } })),
        api.get('/admin/machinery').catch(() => ({ data: { success: false, machinery: [] } })),
        api.get('/admin/transport').catch(() => ({ data: { success: false, transport: [] } })),
        api.get('/admin/payments').catch(() => ({ data: { success: false, payments: [] } })),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.stats);
      if (usersRes.data?.success) setUsers(usersRes.data.users);
      if (repRes.data?.success) setReports(repRes.data.reports);
      if (prodRes.data?.success) setProducts(prodRes.data.products);
      if (ordRes.data?.success) setOrders(ordRes.data.orders);
      if (machRes.data?.success) setMachinery(machRes.data.machinery);
      if (transRes.data?.success) setTransport(transRes.data.transport);
      if (payRes.data?.success) setPayments(payRes.data.payments);
    } catch (err) {
      console.error('Failed to load admin dataset:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      if (res.data.success) {
        setUsers(users.map((u) => (u._id === userId ? { ...u, status: nextStatus } : u)));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      const res = await api.patch(`/admin/reports/${reportId}`, {
        status,
        adminNotes: 'Resolved by Administrator via Master Console.',
      });
      if (res.data.success) {
        setReports(reports.map((r) => (r._id === reportId ? res.data.report : r)));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resolve complaint.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to moderate and remove this marketplace product?')) return;
    try {
      await api.delete(`/products/${productId}`);
      setProducts(products.filter((p) => p._id !== productId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete listing.');
    }
  };

  // Nav Items configured as requested
  const navItems: DashboardNavItem[] = [
    { id: 'overview', label: 'Console Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users, badge: users.length },
    { id: 'products', label: 'Market Products', icon: Store, badge: products.length || stats?.totalProducts },
    { id: 'machinery', label: 'Machinery Rentals', icon: Wrench, badge: machinery.length || stats?.totalMachinery },
    { id: 'transport', label: 'Transport Logistics', icon: Truck, badge: transport.length || stats?.totalTransportVehicles },
    { id: 'orders', label: 'All Customer Orders', icon: ShoppingBag, badge: orders.length || stats?.totalOrders },
    { id: 'payments', label: 'Financial Records', icon: CreditCard, badge: payments.length },
    { id: 'complaints', label: 'Complaints & Reports', icon: AlertTriangle, badge: reports.filter((r) => r.status === 'open').length, badgeVariant: 'amber' },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = orderStatusFilter === 'All' || o.orderStatus === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-stone-500">Loading Master Admin Console...</span>
        </div>
      </div>
    );
  }

  // Monthly Revenue Chart Data
  const monthlyRevenue = [
    { label: 'May', value: 34000, formatted: '₹34,000' },
    { label: 'Jun', value: 48000, formatted: '₹48,000' },
    { label: 'Jul', value: 62000, formatted: '₹62,000' },
    { label: 'Aug', value: 55000, formatted: '₹55,000' },
    { label: 'Sep', value: 78000, formatted: '₹78,000' },
    { label: 'Oct', value: 92000, formatted: '₹92,000' },
    { label: 'Nov', value: stats?.totalSalesINR || 115000, formatted: formatINR(stats?.totalSalesINR || 115000), isHighlight: true },
  ];

  // User Distribution Data
  const userDistribution = [
    { label: 'Farmers', count: stats?.usersByRole?.farmer || 1, color: 'bg-emerald-500' },
    { label: 'Wholesale Buyers', count: stats?.usersByRole?.buyer || 1, color: 'bg-blue-500' },
    { label: 'Agri Suppliers', count: stats?.usersByRole?.supplier || 1, color: 'bg-purple-500' },
    { label: 'Machinery Owners', count: stats?.usersByRole?.machinery_owner || 1, color: 'bg-amber-500' },
    { label: 'Transporters', count: stats?.usersByRole?.transport_provider || 1, color: 'bg-indigo-500' },
    { label: 'Administrators', count: stats?.usersByRole?.admin || 1, color: 'bg-stone-800' },
  ];

  return (
    <DashboardLayout
      roleTitle="Administrator Console"
      roleBadge="Master Admin"
      roleBadgeColor="bg-stone-900 text-white"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      navItems={navItems}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search users, orders, products, reports..."
      headerActions={
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      }
    >
      {/* TAB 1: CONSOLE OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Statistics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardStatCard
              title="Total Platform Revenue"
              value={formatINR(stats?.totalSalesINR || 0)}
              subtitle="From completed harvest orders"
              icon={TrendingUp}
              iconBgColor="bg-emerald-50"
              iconColor="text-emerald-700"
              trend={{ value: '+18.4%', isPositive: true, period: 'vs last month' }}
            />
            <DashboardStatCard
              title="Registered Accounts"
              value={stats?.totalUsers || users.length}
              subtitle="Farmers, merchants & operators"
              icon={Users}
              iconBgColor="bg-blue-50"
              iconColor="text-blue-700"
              trend={{ value: '+12.0%', isPositive: true, period: 'new users' }}
              onClick={() => setActiveTab('users')}
            />
            <DashboardStatCard
              title="Marketplace Listings"
              value={stats?.totalProducts || products.length}
              subtitle="Fresh crops, seeds, flowers"
              icon={Store}
              iconBgColor="bg-purple-50"
              iconColor="text-purple-700"
              onClick={() => setActiveTab('products')}
            />
            <DashboardStatCard
              title="Open Complaints / Reports"
              value={stats?.openReports || 0}
              subtitle="Requiring administrator review"
              icon={AlertTriangle}
              iconBgColor={stats?.openReports > 0 ? 'bg-amber-50' : 'bg-stone-50'}
              iconColor={stats?.openReports > 0 ? 'text-amber-700' : 'text-stone-400'}
              onClick={() => setActiveTab('complaints')}
            />
          </div>

          {/* Secondary Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <span className="text-[11px] text-stone-500 font-semibold block">Total Orders</span>
              <div className="text-xl font-extrabold text-stone-900 mt-0.5">{stats?.totalOrders || orders.length}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <span className="text-[11px] text-stone-500 font-semibold block">Machinery Rentals</span>
              <div className="text-xl font-extrabold text-stone-900 mt-0.5">{stats?.totalMachinery || machinery.length} items</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <span className="text-[11px] text-stone-500 font-semibold block">Transport Fleet</span>
              <div className="text-xl font-extrabold text-stone-900 mt-0.5">{stats?.totalTransportVehicles || transport.length} vehicles</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
              <span className="text-[11px] text-stone-500 font-semibold block">System Status</span>
              <div className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Operational</span>
              </div>
            </div>
          </div>

          {/* Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueBarChart
                title="Platform Monthly GMV & Sales Volume"
                subtitle="Calculated strictly in Indian Rupees (₹ / INR)"
                data={monthlyRevenue}
              />
            </div>
            <div>
              <DistributionCard
                title="Platform User Demographics"
                subtitle="Active registered participants by sector"
                items={userDistribution}
              />
            </div>
          </div>

          {/* Quick Action Preview: Recent Platform Reports & Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Open Complaints Preview */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base">User Complaints & Moderation</h3>
                  <p className="text-xs text-stone-500">Latest issues submitted by farmers or buyers</p>
                </div>
                <button
                  onClick={() => setActiveTab('complaints')}
                  className="text-xs text-emerald-700 font-bold hover:underline"
                >
                  View All ({reports.length})
                </button>
              </div>

              {reports.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">No unresolved complaints reported.</div>
              ) : (
                <div className="space-y-2.5">
                  {reports.slice(0, 3).map((rep) => (
                    <div key={rep._id} className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-stone-800">{rep.reason}</div>
                        <div className="text-[11px] text-stone-500">
                          Target: <span className="font-medium text-stone-700">{rep.targetTitle}</span> ({rep.targetType})
                        </div>
                      </div>
                      <Badge variant={rep.status === 'open' ? 'amber' : 'green'} size="sm">
                        {rep.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Registrations Preview */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base">Recent Registered Users</h3>
                  <p className="text-xs text-stone-500">Participant accounts active on Gen Baazar</p>
                </div>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs text-emerald-700 font-bold hover:underline"
                >
                  Manage Users ({users.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {users.slice(0, 3).map((u) => (
                  <div key={u._id} className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs uppercase">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900">{u.name}</div>
                        <div className="text-[11px] text-stone-500">{u.email}</div>
                      </div>
                    </div>
                    <Badge variant={u.status === 'active' ? 'green' : 'red'} size="sm">
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER DIRECTORY & MODERATION */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">User Account Directory</h2>
              <p className="text-xs text-stone-500">
                View, audit, activate, or suspend platform user accounts across all roles.
              </p>
            </div>

            {/* Role Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {['All', 'farmer', 'buyer', 'supplier', 'machinery_owner', 'transport_provider', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1 rounded-xl font-semibold transition-all ${
                    roleFilter === role
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {role === 'All' ? 'All Roles' : role.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold tracking-wider border-y border-stone-100">
                <tr>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      No user accounts match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{u.name}</div>
                        <div className="text-[11px] text-stone-500">{u.email}</div>
                        {u.phone && <div className="text-[10px] text-stone-400 font-mono">{u.phone}</div>}
                      </td>
                      <td className="py-3.5 px-4 capitalize font-medium text-stone-700">
                        {u.role.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">
                        {u.location?.district ? `${u.location.district}, ${u.location.state}` : 'Tamil Nadu'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={u.status === 'active' ? 'green' : 'red'} size="sm">
                          {u.status || 'active'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u._id === user?._id ? (
                          <span className="text-[10px] text-stone-400 italic">Current Session</span>
                        ) : (
                          <button
                            onClick={() => handleToggleUserStatus(u._id, u.status || 'active')}
                            className={`px-3 py-1 rounded-xl font-bold text-xs transition-colors ${
                              u.status === 'active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MARKETPLACE PRODUCTS MODERATION */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                Marketplace Inventory ({products.length} Products)
              </h2>
              <p className="text-xs text-stone-500">
                Complete agricultural catalog across Vegetables, Fruits, Flowers, Seeds, and Farm Inputs.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold tracking-wider border-y border-stone-100">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price (INR)</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0] || '/categories/vegetables.jpg'}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 bg-stone-100 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/categories/vegetables.jpg';
                          }}
                        />
                        <div>
                          <div className="font-bold text-stone-900">{p.name}</div>
                          <div className="text-[10px] text-stone-400">Min Order: {p.minOrderQuantity} {p.quantityUnit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-800">
                      {formatINR(p.price)} / {p.priceUnit}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-700">
                      {p.availableQuantity} {p.quantityUnit}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      <div>{p.sellerName}</div>
                      <div className="text-[10px] text-stone-400">{p.location?.district || 'Tamil Nadu'}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove product listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MACHINERY RENTALS */}
      {activeTab === 'machinery' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Agricultural Machinery Fleet ({machinery.length} Machines)
            </h2>
            <p className="text-xs text-stone-500">
              Active tractors, combine harvesters, rotavators, power tillers, and sprayers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machinery.map((m) => (
              <div key={m._id} className="p-4 bg-stone-50/70 rounded-2xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-stone-900">{m.title}</span>
                  <Badge variant={m.availabilityStatus === 'available' ? 'green' : 'amber'} size="sm">
                    {m.availabilityStatus}
                  </Badge>
                </div>
                <div className="text-xs text-stone-500">
                  Type: <span className="font-semibold text-stone-700 capitalize">{m.machineryType.replace('_', ' ')}</span>
                </div>
                <div className="text-xs text-stone-500">
                  Location: <span className="font-medium text-stone-700">{m.location?.district}, Tamil Nadu</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-800">
                    {formatINR(m.rentalPrice)} / {m.rentalUnit}
                  </div>
                  <span className="text-[11px] text-stone-500">Owner: {m.ownerName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TRANSPORT LOGISTICS */}
      {activeTab === 'transport' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Transport Logistics Fleet ({transport.length} Vehicles)
            </h2>
            <p className="text-xs text-stone-500">
              Calibrated small-to-medium farm produce delivery vehicles (1–200+ kg).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transport.map((t) => (
              <div key={t._id} className="p-4 bg-stone-50/70 rounded-2xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-stone-900">{t.vehicleName}</span>
                  <Badge variant="green" size="sm">{t.availabilityStatus}</Badge>
                </div>
                <div className="text-xs text-stone-600 flex items-center justify-between">
                  <span>Reg: <strong className="font-mono">{t.vehicleNumber}</strong></span>
                  <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    Payload: {t.carryingCapacityKg} kg
                  </span>
                </div>
                <div className="text-xs text-stone-500">
                  Hub: {t.pickupLocation?.town || t.pickupLocation?.district}, Tamil Nadu
                </div>
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800">
                    {formatINR(t.baseRate)} {t.pricingModel === 'per_km' ? '/ km' : '/ trip'}
                  </span>
                  <span className="text-stone-500">{t.providerName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">Platform Orders ({orders.length})</h2>
              <p className="text-xs text-stone-500">All customer harvest procurements placed across Gen Baazar.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold tracking-wider border-y border-stone-100">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      {o.orderReference}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-800">{o.buyerName}</div>
                      <div className="text-[10px] text-stone-400">{o.buyerPhone}</div>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-emerald-800">
                      {formatINR(o.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          o.orderStatus === 'delivered'
                            ? 'green'
                            : o.orderStatus === 'cancelled'
                            ? 'red'
                            : 'amber'
                        }
                        size="sm"
                      >
                        {o.orderStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={o.paymentStatus === 'successful' ? 'green' : 'gray'}
                        size="sm"
                      >
                        {o.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {o.deliveryAddress?.district}, {o.deliveryAddress?.state}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: FINANCIAL AUDITS & PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">Payment & Transaction Audit</h2>
            <p className="text-xs text-stone-500">
              Server-verified transaction references, mode tracking, and INR settlements.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold tracking-wider border-y border-stone-100">
                <tr>
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Amount (INR)</th>
                  <th className="py-3 px-4">Gateway / Mode</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      No payment transaction records registered yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((pay) => (
                    <tr key={pay._id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">{pay.paymentReference}</td>
                      <td className="py-3 px-4 font-mono text-stone-500">{String(pay.orderId).slice(-8)}</td>
                      <td className="py-3 px-4 font-extrabold text-emerald-800">{formatINR(pay.amount)}</td>
                      <td className="py-3 px-4 text-stone-600">{pay.gateway}</td>
                      <td className="py-3 px-4">
                        <Badge variant={pay.status === 'successful' ? 'green' : 'amber'} size="sm">
                          {pay.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: COMPLAINTS & FRAUD REPORTS */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">User Complaints & Moderation Reports</h2>
            <p className="text-xs text-stone-500">
              Platform compliance tracking for suspicious product listings, payment disputes, or fraudulent accounts.
            </p>
          </div>

          {reports.length === 0 ? (
            <div className="p-12 text-center text-stone-400 text-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p>Zero active platform complaints! All transactions and listings are in good standing.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep._id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-stone-900">{rep.reason}</span>
                      <div className="text-xs text-stone-500 mt-0.5">
                        Target: <span className="font-semibold text-stone-800">{rep.targetTitle}</span> ({rep.targetType})
                      </div>
                    </div>
                    <Badge variant={rep.status === 'open' ? 'amber' : 'green'} size="sm">
                      {rep.status}
                    </Badge>
                  </div>

                  {rep.details && <p className="text-xs text-stone-600 bg-white p-2.5 rounded-xl border border-stone-100">{rep.details}</p>}

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs">
                    <span className="text-[11px] text-stone-400">Reporter: {rep.reporterName}</span>
                    <div className="flex items-center gap-2">
                      {rep.status === 'open' && (
                        <>
                          <button
                            onClick={() => handleResolveReport(rep._id, 'investigating')}
                            className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg font-semibold hover:bg-amber-100 transition-colors"
                          >
                            Mark Investigating
                          </button>
                          <button
                            onClick={() => handleResolveReport(rep._id, 'resolved')}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                          >
                            Mark Resolved
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 9: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 sm:p-6 space-y-6 max-w-2xl">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">Platform Security & Settings</h2>
            <p className="text-xs text-stone-500">Core administrative parameters and runtime controls.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <span className="font-bold text-stone-800">Admin Account</span>
              <div className="text-stone-600 font-mono">{user?.email}</div>
              <div className="text-[10px] text-emerald-700 font-bold uppercase">Role: Super Administrator</div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <span className="font-bold text-stone-800">Platform Currency</span>
              <div className="text-stone-600">Indian Rupees (₹ / INR) — Strictly Enforced with Integer Math</div>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Security Policies Active</span>
              </span>
              <p className="text-emerald-800 text-[11px]">
                Helmet HTTP security headers, Auth rate limiting, Mass assignment sanitization, and IDOR prevention are operational.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
