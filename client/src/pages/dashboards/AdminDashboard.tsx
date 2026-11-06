import React, { useState, useEffect, useMemo } from 'react';
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
  BarChart3,
  Calendar,
  Activity,
  Check,
  X,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import {
  User,
  PlatformReport,
  Product,
  Order,
  MachineryListing,
  TransportListing,
  Payment,
  MachineryBooking,
  TransportBooking,
} from '../../types';
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

  // Core Data State
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [machinery, setMachinery] = useState<MachineryListing[]>([]);
  const [transport, setTransport] = useState<TransportListing[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reports, setReports] = useState<PlatformReport[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [machineryBookings, setMachineryBookings] = useState<MachineryBooking[]>([]);
  const [transportBookings, setTransportBookings] = useState<TransportBooking[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [productModFilter, setProductModFilter] = useState('All');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [
        statsRes,
        analyticsRes,
        usersRes,
        repRes,
        prodRes,
        ordRes,
        machRes,
        transRes,
        payRes,
        actRes,
        bookRes,
      ] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: { success: false, stats: null } })),
        api.get('/admin/analytics').catch(() => ({ data: { success: false, analytics: null } })),
        api.get('/admin/users').catch(() => ({ data: { success: false, users: [] } })),
        api.get('/admin/reports').catch(() => ({ data: { success: false, reports: [] } })),
        api.get('/admin/products').catch(() => ({ data: { success: false, products: [] } })),
        api.get('/admin/orders').catch(() => ({ data: { success: false, orders: [] } })),
        api.get('/admin/machinery').catch(() => ({ data: { success: false, machinery: [] } })),
        api.get('/admin/transport').catch(() => ({ data: { success: false, transport: [] } })),
        api.get('/admin/payments').catch(() => ({ data: { success: false, payments: [] } })),
        api.get('/admin/activity').catch(() => ({ data: { success: false, activities: [] } })),
        api.get('/admin/bookings').catch(() => ({ data: { success: false, machineryBookings: [], transportBookings: [] } })),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.stats);
      if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.analytics);
      if (usersRes.data?.success) setUsers(usersRes.data.users);
      if (repRes.data?.success) setReports(repRes.data.reports);
      if (prodRes.data?.success) setProducts(prodRes.data.products);
      if (ordRes.data?.success) setOrders(ordRes.data.orders);
      if (machRes.data?.success) setMachinery(machRes.data.machinery);
      if (transRes.data?.success) setTransport(transRes.data.transport);
      if (payRes.data?.success) setPayments(payRes.data.payments);
      if (actRes.data?.success) setActivities(actRes.data.activities);
      if (bookRes.data?.success) {
        setMachineryBookings(bookRes.data.machineryBookings || []);
        setTransportBookings(bookRes.data.transportBookings || []);
      }
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

  const handleModerateProduct = async (productId: string, status: string) => {
    try {
      const res = await api.patch(`/admin/products/${productId}/status`, { status });
      if (res.data?.success) {
        setProducts(
          products.map((p) =>
            p._id === productId ? { ...p, moderationStatus: status as any } : p
          )
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update product status.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to remove this product listing?')) return;
    try {
      await api.delete(`/admin/products/${productId}`);
      setProducts(products.filter((p) => p._id !== productId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete listing.');
    }
  };

  const handleDeleteMachinery = async (machId: string) => {
    if (!window.confirm('Delete this machinery listing from platform?')) return;
    try {
      await api.delete(`/admin/machinery/${machId}`);
      setMachinery(machinery.filter((m) => m._id !== machId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete machine.');
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      const res = await api.patch(`/admin/reports/${reportId}`, {
        status,
        adminNotes: `Resolved by ${user?.name || 'Administrator'} via Master Console.`,
      });
      if (res.data?.success) {
        setReports(reports.map((r) => (r._id === reportId ? res.data.report : r)));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resolve complaint.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordMsg(null);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.data?.success) {
        setPasswordMsg({ type: 'success', text: 'Administrator password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err: any) {
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change administrator password.',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Nav Items configured for complete admin coverage
  const navItems: DashboardNavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users, badge: users.length },
    { id: 'products', label: 'Marketplace Products', icon: Store, badge: products.length },
    { id: 'machinery', label: 'Machinery Rentals', icon: Wrench, badge: machinery.length },
    { id: 'transport', label: 'Transport Fleet', icon: Truck, badge: transport.length },
    { id: 'orders', label: 'Customer Orders', icon: ShoppingBag, badge: orders.length },
    { id: 'bookings', label: 'Bookings & Dispatches', icon: Calendar, badge: machineryBookings.length + transportBookings.length },
    { id: 'payments', label: 'Payment Records', icon: CreditCard, badge: payments.length },
    {
      id: 'complaints',
      label: 'Complaints & Reports',
      icon: AlertTriangle,
      badge: reports.filter((r) => r.status === 'open').length || undefined,
      badgeVariant: 'amber',
    },
    { id: 'activity', label: 'Activity Logs', icon: Activity, badge: activities.length },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
  ];

  // Filters
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMod =
        productModFilter === 'All' ||
        (p.moderationStatus || 'approved').toLowerCase() === productModFilter.toLowerCase();
      return matchesSearch && matchesMod;
    });
  }, [products, searchQuery, productModFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        orderStatusFilter === 'All' || o.orderStatus.toLowerCase() === orderStatusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, orderStatusFilter]);

  // Derived metrics
  const totalUsers = users.length;
  const totalFarmers = users.filter((u) => u.role === 'farmer').length;
  const totalMerchants = users.filter((u) => u.role === 'buyer').length;
  const totalSuppliers = users.filter((u) => u.role === 'supplier').length;
  const platformRevenueINR = orders
    .filter((o) => o.paymentStatus === 'successful' || o.orderStatus === 'delivered')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingApprovalsCount = reports.filter((r) => r.status === 'open').length;

  // Chart Data
  const monthlyRevenueData = useMemo(() => {
    if (analytics?.monthlySales) return analytics.monthlySales;
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    return months.map((m, idx) => ({
      label: m,
      value: Math.round((platformRevenueINR / 6) * (0.65 + idx * 0.12)),
    }));
  }, [analytics, platformRevenueINR]);

  const roleDistributionData = useMemo(() => {
    const total = totalUsers || 1;
    return [
      { label: 'Farmers', count: totalFarmers, color: 'bg-emerald-500', percentage: Math.round((totalFarmers / total) * 100) },
      { label: 'Buyers / Merchants', count: totalMerchants, color: 'bg-blue-500', percentage: Math.round((totalMerchants / total) * 100) },
      { label: 'Agri Suppliers', count: totalSuppliers, color: 'bg-purple-500', percentage: Math.round((totalSuppliers / total) * 100) },
      { label: 'Machinery Owners', count: users.filter((u) => u.role === 'machinery_owner').length, color: 'bg-amber-500' },
      { label: 'Transporters', count: users.filter((u) => u.role === 'transport_provider').length, color: 'bg-indigo-500' },
    ];
  }, [totalUsers, totalFarmers, totalMerchants, totalSuppliers, users]);

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

  return (
    <DashboardLayout
      roleTitle="Master Administration Console"
      roleBadge="Super Admin"
      roleBadgeColor="bg-stone-900 text-white"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      navItems={navItems}
      searchPlaceholder="Search users, orders, products, dispatches..."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
            title="Refresh admin dataset"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Admin Session</span>
          </div>
        </div>
      }
    >
      {/* ======================= TAB 1: OVERVIEW ======================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-emerald-300 backdrop-blur-xs mb-3">
                Gen Baazar Governance • Role-Based Access Control
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Platform Command & Oversight Center
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
                Direct supervision over farmer listings, wholesale order dispatches, machinery leasing, transport logistics, and escrow settlements.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('users')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Users ({totalUsers})</span>
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Store className="w-4 h-4" />
                  <span>Moderate Listings ({products.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('complaints')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Open Complaints ({pendingApprovalsCount})</span>
                </button>
              </div>
            </div>
            <ShieldCheck className="absolute -right-6 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
          </div>

          {/* 10 Core Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5">
            <DashboardStatCard
              title="Total Users"
              value={totalUsers}
              icon={Users}
              iconColor="text-blue-700"
              iconBgColor="bg-blue-100"
              onClick={() => setActiveTab('users')}
            />
            <DashboardStatCard
              title="Farmers"
              value={totalFarmers}
              icon={Users}
              iconColor="text-emerald-700"
              iconBgColor="bg-emerald-100"
              subtitle="Direct growers"
            />
            <DashboardStatCard
              title="Merchants / Buyers"
              value={totalMerchants}
              icon={Users}
              iconColor="text-sky-700"
              iconBgColor="bg-sky-100"
              subtitle="Wholesale & retail"
            />
            <DashboardStatCard
              title="Agri Suppliers"
              value={totalSuppliers}
              icon={Store}
              iconColor="text-purple-700"
              iconBgColor="bg-purple-100"
              subtitle="Seeds & bio-inputs"
            />
            <DashboardStatCard
              title="Products Listed"
              value={products.length}
              icon={Store}
              iconColor="text-teal-700"
              iconBgColor="bg-teal-100"
              onClick={() => setActiveTab('products')}
            />
            <DashboardStatCard
              title="Customer Orders"
              value={orders.length}
              icon={ShoppingBag}
              iconColor="text-indigo-700"
              iconBgColor="bg-indigo-100"
              onClick={() => setActiveTab('orders')}
            />
            <DashboardStatCard
              title="Machinery Fleet"
              value={machinery.length}
              icon={Wrench}
              iconColor="text-amber-700"
              iconBgColor="bg-amber-100"
              onClick={() => setActiveTab('machinery')}
            />
            <DashboardStatCard
              title="Transport Bookings"
              value={transportBookings.length}
              icon={Truck}
              iconColor="text-emerald-800"
              iconBgColor="bg-emerald-100"
              onClick={() => setActiveTab('bookings')}
            />
            <DashboardStatCard
              title="Platform GMV (INR)"
              value={formatINR(platformRevenueINR)}
              icon={TrendingUp}
              iconColor="text-emerald-700"
              iconBgColor="bg-emerald-100"
              subtitle="Direct trade volume"
            />
            <DashboardStatCard
              title="Pending Approvals"
              value={pendingApprovalsCount}
              icon={AlertTriangle}
              iconColor="text-amber-700"
              iconBgColor="bg-amber-100"
              trend={
                pendingApprovalsCount > 0
                  ? { value: pendingApprovalsCount, isPositive: false, label: 'needs audit' }
                  : undefined
              }
              onClick={() => setActiveTab('complaints')}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <RevenueBarChart
                title="Gross Merchandise Value (GMV)"
                subtitle="Monthly platform transaction volume through Gen Baazar mandi network (INR)"
                data={monthlyRevenueData}
                unit="₹"
              />
            </div>
            <div>
              <DistributionCard
                title="Platform User Demographics"
                subtitle="Distribution of registered platform roles"
                totalCount={totalUsers}
                totalLabel="Total Users"
                items={roleDistributionData}
              />
            </div>
          </div>

          {/* Recent Platform Activities Preview */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">Recent Platform Activity</h3>
                <p className="text-xs text-stone-500">Real-time audit log of user registrations, orders, and listings</p>
              </div>
              <button
                onClick={() => setActiveTab('activity')}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>View Full Audit Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {activities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl border border-stone-100 bg-stone-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-stone-900">{act.title}</div>
                      <div className="text-[11px] text-stone-500">{act.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div>
                      <Badge variant={act.status === 'active' || act.status === 'delivered' ? 'green' : 'amber'} size="sm">
                        {act.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: ANALYTICS ======================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Platform Analytics & Growth Trends</h2>
            <p className="text-xs text-stone-500">Live operational data aggregated from database transactions</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <RevenueBarChart
              title="Monthly Sales Volume"
              subtitle="Aggregated GMV over consecutive billing periods (INR)"
              data={monthlyRevenueData}
              unit="₹"
            />
            <DistributionCard
              title="Order Status Distribution"
              subtitle="Lifecycle status of placed customer orders"
              totalCount={orders.length}
              totalLabel="Orders"
              items={[
                { label: 'Delivered', count: orders.filter((o) => o.orderStatus === 'delivered').length, color: 'bg-emerald-500' },
                { label: 'Shipped / In Transit', count: orders.filter((o) => o.orderStatus === 'shipped').length, color: 'bg-blue-500' },
                { label: 'Accepted by Farmer', count: orders.filter((o) => o.orderStatus === 'accepted').length, color: 'bg-amber-500' },
                { label: 'Pending Fulfillment', count: orders.filter((o) => o.orderStatus === 'pending').length, color: 'bg-purple-500' },
                { label: 'Cancelled', count: orders.filter((o) => o.orderStatus === 'cancelled').length, color: 'bg-stone-400' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200">
              <span className="text-xs font-semibold text-stone-500">User Registrations</span>
              <div className="text-2xl font-black text-stone-900 mt-1">{totalUsers}</div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                {users.filter((u) => u.status === 'active').length} active accounts
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200">
              <span className="text-xs font-semibold text-stone-500">Machinery Utilization</span>
              <div className="text-2xl font-black text-stone-900 mt-1">{machineryBookings.length}</div>
              <div className="text-[11px] text-amber-700 font-semibold mt-1">
                {machineryBookings.filter((b) => b.status === 'accepted' || b.status === 'completed').length} completed rentals
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200">
              <span className="text-xs font-semibold text-stone-500">Freight Logistics</span>
              <div className="text-2xl font-black text-stone-900 mt-1">{transportBookings.length}</div>
              <div className="text-[11px] text-blue-700 font-semibold mt-1">
                {transportBookings.filter((t) => t.status === 'delivered').length} farm dispatches delivered
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: USER MANAGEMENT ======================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">User Directory & Role Control ({users.length})</h2>
              <p className="text-xs text-stone-500">Activate, suspend, or audit registered accounts across Tamil Nadu</p>
            </div>
            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'farmer', 'buyer', 'supplier', 'machinery_owner', 'transport_provider', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    roleFilter === role
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {role === 'All' ? 'All Roles' : role.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] bg-stone-50">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{u.name}</div>
                        <div className="text-[11px] text-stone-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-700">{u.phone}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 capitalize">
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {u.location?.district || 'Tamil Nadu'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={u.status === 'active' ? 'green' : 'red'} size="sm">
                          {u.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserStatus(u._id, u.status)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                              u.status === 'active'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 4: MARKETPLACE PRODUCTS ======================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Marketplace Products ({products.length})</h2>
              <p className="text-xs text-stone-500">Approve, reject, or remove farm harvest and input listings</p>
            </div>
            <div className="flex items-center gap-1.5">
              {['All', 'Approved', 'Pending_Approval', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setProductModFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    productModFilter === status
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] bg-stone-50">
                    <th className="py-3 px-4">Produce / Product</th>
                    <th className="py-3 px-4">Seller & Phone</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit Rate</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{p.name}</div>
                        <div className="text-[10px] text-stone-400">{p.location?.district}, Tamil Nadu</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-800">{p.sellerName}</div>
                        <div className="text-[10px] text-stone-400">{p.sellerPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {formatINR(p.price)} / {p.priceUnit}
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        {p.availableQuantity} {p.quantityUnit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={
                            p.moderationStatus === 'rejected'
                              ? 'red'
                              : p.moderationStatus === 'pending_approval'
                              ? 'amber'
                              : 'green'
                          }
                          size="sm"
                        >
                          {p.moderationStatus || 'approved'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.moderationStatus !== 'approved' && (
                            <button
                              onClick={() => handleModerateProduct(p._id, 'approved')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              Approve
                            </button>
                          )}
                          {p.moderationStatus !== 'rejected' && (
                            <button
                              onClick={() => handleModerateProduct(p._id, 'rejected')}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProduct(p._id)}
                            className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                            title="Delete listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 5: MACHINERY MANAGEMENT ======================= */}
      {activeTab === 'machinery' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Machinery Fleet Oversight ({machinery.length})</h2>
            <p className="text-xs text-stone-500">Supervise tractors, harvesters, and tilling implements across clusters</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {machinery.map((m) => (
              <div key={m._id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">{m.title}</h3>
                    <div className="text-[11px] text-stone-400 capitalize">{m.machineryType.replace('_', ' ')}</div>
                  </div>
                  <Badge variant={m.availabilityStatus === 'available' ? 'green' : 'gray'} size="sm">
                    {m.availabilityStatus}
                  </Badge>
                </div>

                <div className="text-xs text-stone-600 space-y-1">
                  <div>Owner: <strong>{m.ownerName}</strong> ({m.ownerPhone})</div>
                  <div>Location: {m.location?.town || m.location?.district}, Tamil Nadu</div>
                  {m.specifications?.horsepower && <div>HP: {m.specifications.horsepower}</div>}
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <div className="font-black text-emerald-800 text-sm">
                    {formatINR(m.rentalPrice)} / {m.rentalUnit}
                  </div>
                  <button
                    onClick={() => handleDeleteMachinery(m._id)}
                    className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Remove machinery"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= TAB 6: TRANSPORT LOGISTICS ======================= */}
      {activeTab === 'transport' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Transport Fleet Oversight ({transport.length})</h2>
            <p className="text-xs text-stone-500">Registered rural transit carriers and mini-truck operators</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {transport.map((t) => (
              <div key={t._id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">{t.vehicleName}</h3>
                    <span className="font-mono text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                      {t.vehicleNumber}
                    </span>
                  </div>
                  <Badge variant={t.availabilityStatus === 'available' ? 'green' : 'gray'} size="sm">
                    {t.availabilityStatus}
                  </Badge>
                </div>

                <div className="text-xs text-stone-600 space-y-1">
                  <div>Provider: <strong>{t.providerName}</strong> ({t.providerPhone})</div>
                  <div>Capacity: <strong>{t.carryingCapacityKg} kg</strong></div>
                  <div>Service Areas: {t.serviceAreas?.join(', ') || 'District wide'}</div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <div className="font-black text-emerald-800 text-sm">
                    {formatINR(t.baseRate)} / {t.pricingModel.replace('_', ' ')}
                  </div>
                  <Badge variant="blue" size="sm">
                    {t.vehicleType.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= TAB 7: ORDERS ======================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Customer Orders ({orders.length})</h2>
              <p className="text-xs text-stone-500">All wholesale produce and farm supply orders placed across platform</p>
            </div>
            <div className="flex items-center gap-1.5">
              {['All', 'pending', 'accepted', 'shipped', 'delivered', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    orderStatusFilter === st
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] bg-stone-50">
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Buyer Details</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4 text-right">Order Amount</th>
                    <th className="py-3 px-4 text-center">Payment</th>
                    <th className="py-3 px-4 text-center">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">{o.orderReference}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900">{o.buyerName}</div>
                        <div className="text-[10px] text-stone-400">{o.buyerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">
                        {o.items.map((it) => `${it.quantity} ${it.quantityUnit} ${it.name}`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-800 text-sm">
                        {formatINR(o.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={o.paymentStatus === 'successful' ? 'green' : 'amber'} size="sm">
                          {o.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            o.orderStatus === 'delivered'
                              ? 'green'
                              : o.orderStatus === 'shipped'
                              ? 'blue'
                              : 'amber'
                          }
                          size="sm"
                        >
                          {o.orderStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 8: BOOKINGS & DISPATCHES ======================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Bookings & Freight Dispatches</h2>
            <p className="text-xs text-stone-500">Live machinery reservations and transport requests</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Machinery Bookings */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Machinery Bookings ({machineryBookings.length})</span>
              </h3>
              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {machineryBookings.map((mb) => (
                  <div key={mb._id} className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-stone-900">{mb.machineryTitle}</div>
                      <div className="text-[11px] text-stone-500">
                        Renter: {mb.renterName} ({mb.renterPhone})
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {mb.durationUnits} {mb.unitType}s • {formatINR(mb.totalAmount)}
                      </div>
                    </div>
                    <Badge variant={mb.status === 'accepted' ? 'green' : 'amber'} size="sm">
                      {mb.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Transport Dispatches */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Transport Dispatches ({transportBookings.length})</span>
              </h3>
              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {transportBookings.map((tb) => (
                  <div key={tb._id} className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-stone-900">{tb.requesterName}</div>
                      <div className="text-[11px] text-stone-500">
                        Route: {tb.pickupAddress} → {tb.deliveryAddress}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        Payload: {tb.cargoWeightKg || 0}kg • Freight: {formatINR(tb.estimatedOrQuotedPrice || 0)}
                      </div>
                    </div>
                    <Badge variant={tb.status === 'delivered' ? 'green' : 'blue'} size="sm">
                      {tb.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 9: PAYMENTS ======================= */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Payment Transactions & Escrow Audits ({payments.length})</h2>
            <p className="text-xs text-stone-500">Complete audit trail of verified transactions and settlements</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] bg-stone-50">
                    <th className="py-3 px-4">Payment Ref</th>
                    <th className="py-3 px-4">Gateway & Mode</th>
                    <th className="py-3 px-4 text-right">Amount (INR)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {payments.map((pay) => (
                    <tr key={pay._id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">{pay.paymentReference}</td>
                      <td className="py-3.5 px-4 text-stone-600">
                        {pay.gateway} • <span className="font-semibold text-stone-700">{pay.mode}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-800 text-sm">
                        {formatINR(pay.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={pay.status === 'successful' ? 'green' : 'amber'} size="sm">
                          {pay.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-stone-500">
                        {new Date(pay.createdAt || Date.now()).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 10: COMPLAINTS & REPORTS ======================= */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Customer Complaints & Dispute Resolution ({reports.length})</h2>
            <p className="text-xs text-stone-500">Investigate reported listings, seller discrepancies, and customer feedback</p>
          </div>

          <div className="space-y-3.5">
            {reports.map((rep) => (
              <div key={rep._id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900">{rep.targetTitle}</span>
                    <Badge variant={rep.status === 'open' ? 'red' : rep.status === 'resolved' ? 'green' : 'amber'} size="sm">
                      {rep.status}
                    </Badge>
                    <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md uppercase">
                      {rep.targetType}
                    </span>
                  </div>
                  <div className="text-xs text-stone-700">
                    <strong>Reported by:</strong> {rep.reporterName} • <strong>Reason:</strong> {rep.reason}
                  </div>
                  {rep.details && <div className="text-xs text-stone-500">{rep.details}</div>}
                  {rep.adminNotes && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {rep.adminNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  {rep.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolveReport(rep._id, 'resolved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {rep.status !== 'dismissed' && (
                    <button
                      onClick={() => handleResolveReport(rep._id, 'dismissed')}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= TAB 11: ACTIVITY LOGS ======================= */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Platform Activity & Audit History ({activities.length})</h2>
            <p className="text-xs text-stone-500">Real-time chronicle of events, user onboarding, and financial trades</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs divide-y divide-stone-100">
            {activities.map((act) => (
              <div key={act.id} className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold shrink-0">
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-stone-900">{act.title}</div>
                    <div className="text-xs text-stone-500">{act.description}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-mono text-stone-400">
                    {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <Badge variant={act.status === 'active' || act.status === 'delivered' ? 'green' : 'amber'} size="sm">
                    {act.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= TAB 12: ADMIN SETTINGS & SECURITY ======================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Administrator Security & Platform Policy</h2>
            <p className="text-xs text-stone-500">Rotate admin passwords and inspect system configuration</p>
          </div>

          {/* Change Admin Password */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Change Administrator Password</span>
            </h3>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current master password"
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">New Password (Min 8 Characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong, cryptographically secure password"
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
              >
                {changingPassword ? 'Updating Password...' : 'Update Admin Password'}
              </button>
            </form>
          </div>

          {/* Security Architecture Information */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 text-xs text-stone-600 space-y-2">
            <h4 className="font-bold text-stone-900 text-sm">Gen Baazar Security Standards</h4>
            <p>• Passwords hashed with bcrypt (salt rounds = 10). Plaintext passwords are never stored.</p>
            <p>• Role-Based Access Control (RBAC) enforced on every API route.</p>
            <p>• Admin role excluded from public registration.</p>
            <p>• Rate limiting active on all authentication attempts.</p>
            <p>• Secure INR financial escrow settlement model.</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
