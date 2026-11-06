import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Search,
  RefreshCw,
  ExternalLink,
  Store,
  ChevronRight,
  MapPin,
  FileText,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import api from '../../services/api';
import { Order } from '../../types';
import { formatINR } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { DashboardLayout, DashboardNavItem } from '../../components/DashboardLayout';
import { DashboardStatCard } from '../../components/DashboardStatCard';
import { RevenueBarChart, DistributionCard } from '../../components/DashboardCharts';

export const BuyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my');
      if (res.data?.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to load buyer orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Metrics
  const totalOrders = orders.length;
  const pendingDeliveries = orders.filter((o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled').length;
  const completedDeliveries = orders.filter((o) => o.orderStatus === 'delivered').length;
  const totalSpentINR = orders
    .filter((o) => o.paymentStatus === 'successful' || o.orderStatus === 'delivered')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Status Distribution
  const orderStatusDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      Delivered: 0,
      Shipped: 0,
      Accepted: 0,
      Pending: 0,
      Cancelled: 0,
    };
    orders.forEach((o) => {
      const s = o.orderStatus.charAt(0).toUpperCase() + o.orderStatus.slice(1);
      if (counts[s] !== undefined) counts[s] += 1;
    });

    const total = orders.length || 1;
    const colors: Record<string, string> = {
      Delivered: 'bg-emerald-500',
      Shipped: 'bg-blue-500',
      Accepted: 'bg-amber-500',
      Pending: 'bg-purple-500',
      Cancelled: 'bg-stone-400',
    };

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        value: count,
        color: colors[name] || 'bg-stone-500',
        percentage: Math.round((count / total) * 100),
      }));
  }, [orders]);

  // Spending Trend (6 months)
  const spendingTrendData = useMemo(() => {
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    return months.map((m, idx) => {
      const amount = (totalSpentINR / 6) * (0.7 + idx * 0.12);
      return {
        label: m,
        value: Math.round(amount),
      };
    });
  }, [totalSpentINR]);

  const navItems: DashboardNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Procurement Orders', icon: ShoppingBag, badge: totalOrders },
    {
      id: 'tracking',
      label: 'Live Tracking',
      icon: Truck,
      badge: pendingDeliveries > 0 ? pendingDeliveries : undefined,
      badgeVariant: 'blue',
    },
    { id: 'payments', label: 'Payment Records', icon: CreditCard },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.deliveryAddress?.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter =
        statusFilter === 'All' || o.orderStatus.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [orders, searchQuery, statusFilter]);

  return (
    <DashboardLayout
      roleTitle="Buyer & Merchant Desk"
      roleBadge="Commercial Buyer"
      roleBadgeColor="bg-blue-100 text-blue-800"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      navItems={navItems}
      searchPlaceholder="Search orders, produce, references..."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Procure Produce</span>
          </Link>
        </div>
      }
    >
      {/* ======================= OVERVIEW TAB ======================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-sky-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs mb-3">
                {user?.farmOrBusinessName || 'Direct Wholesale Buyer'} • {user?.location?.district || 'Tamil Nadu'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Direct Farm Sourcing, Guaranteed Freshness.
              </h1>
              <p className="text-xs sm:text-sm text-sky-100 mt-2 leading-relaxed">
                Source directly from verified local farmers and agricultural suppliers. Transparent farm-gate pricing with escrow-secured settlements.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="px-4 py-2 bg-white text-blue-950 font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Store className="w-4 h-4 text-blue-700" />
                  <span>Browse Marketplace</span>
                </Link>
                <Link
                  to="/market-prices"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Mandi APMC Rates</span>
                </Link>
                <Link
                  to="/transport"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>Book Transport Hub</span>
                </Link>
              </div>
            </div>
            <ShoppingBag className="absolute -right-6 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <DashboardStatCard
              title="Total Orders Placed"
              value={totalOrders}
              icon={ShoppingBag}
              iconColor="text-blue-700"
              iconBg="bg-blue-100"
              trend={{ value: 18.5, isPositive: true, label: 'vs last month' }}
              actionLabel="View all orders"
              onAction={() => setActiveTab('orders')}
            />
            <DashboardStatCard
              title="Pending Deliveries"
              value={pendingDeliveries}
              icon={Clock}
              iconColor="text-amber-700"
              iconBg="bg-amber-100"
              subtitle="Active farm dispatches"
              actionLabel="Track deliveries"
              onAction={() => setActiveTab('tracking')}
            />
            <DashboardStatCard
              title="Completed Procurements"
              value={completedDeliveries}
              icon={CheckCircle2}
              iconColor="text-emerald-700"
              iconBg="bg-emerald-100"
              trend={{ value: 12.0, isPositive: true, label: 'fulfillment rate 96%' }}
            />
            <DashboardStatCard
              title="Total Purchases (INR)"
              value={formatINR(totalSpentINR)}
              icon={CreditCard}
              iconColor="text-sky-800"
              iconBg="bg-sky-100"
              subtitle="UPI, RuPay & NetBanking"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <RevenueBarChart
                title="Procurement Volume & Spend"
                subtitle="Monthly harvest procurement expenditure (INR)"
                data={spendingTrendData}
                unit="₹"
              />
            </div>
            <div>
              <DistributionCard
                title="Order Fulfillment Status"
                subtitle="Lifecycle breakdown of placed orders"
                totalCount={totalOrders}
                totalLabel="Total Orders"
                items={
                  orderStatusDistribution.length > 0
                    ? orderStatusDistribution
                    : [{ name: 'No orders yet', value: 0, color: 'bg-stone-300', percentage: 100 }]
                }
              />
            </div>
          </div>

          {/* Recent Purchases Snapshot */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">Recent Procurement Orders</h3>
                <p className="text-xs text-stone-500">Track shipments and view verified farmer receipts</p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
              >
                <span>View All ({orders.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-xs">
                You haven't placed any orders yet. Visit the marketplace to source fresh produce.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 4).map((order) => (
                  <div
                    key={order._id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-stone-900">{order.orderReference}</span>
                        <Badge
                          variant={
                            order.orderStatus === 'delivered'
                              ? 'green'
                              : order.orderStatus === 'shipped'
                              ? 'blue'
                              : order.orderStatus === 'accepted'
                              ? 'amber'
                              : 'gray'
                          }
                          size="sm"
                        >
                          {order.orderStatus}
                        </Badge>
                        <Badge variant={order.paymentStatus === 'successful' ? 'green' : 'amber'} size="sm">
                          Payment: {order.paymentStatus}
                        </Badge>
                      </div>

                      <div className="text-xs text-stone-700 flex flex-wrap gap-2">
                        {order.items.map((it, idx) => (
                          <span key={idx} className="bg-white px-2 py-0.5 rounded-md border border-stone-200">
                            <strong>{it.name}</strong> • {it.quantity} {it.quantityUnit} ({formatINR(it.subtotal)})
                          </span>
                        ))}
                      </div>

                      <div className="text-[11px] text-stone-400">
                        Delivery to: {order.deliveryAddress?.addressLine}, {order.deliveryAddress?.district}
                      </div>
                    </div>

                    <div className="text-left md:text-right pt-2 md:pt-0 border-t md:border-t-0 border-stone-200 flex md:flex-col justify-between items-center md:items-end">
                      <div>
                        <div className="text-[10px] text-stone-500">Order Amount</div>
                        <div className="text-base font-black text-emerald-800">{formatINR(order.totalAmount)}</div>
                      </div>
                      <button
                        onClick={() => setActiveTab('tracking')}
                        className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 mt-1"
                      >
                        <span>Track</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= ORDERS TAB ======================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Procurement Orders ({orders.length})</h2>
              <p className="text-xs text-stone-500">Full order history and item details</p>
            </div>
            {/* Status pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 text-xs">
                No orders match your filter criteria.
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-stone-900">{order.orderReference}</span>
                      <Badge
                        variant={
                          order.orderStatus === 'delivered'
                            ? 'green'
                            : order.orderStatus === 'shipped'
                            ? 'blue'
                            : order.orderStatus === 'accepted'
                            ? 'amber'
                            : 'gray'
                        }
                        size="sm"
                      >
                        {order.orderStatus}
                      </Badge>
                      <Badge variant={order.paymentStatus === 'successful' ? 'green' : 'amber'} size="sm">
                        Payment: {order.paymentStatus}
                      </Badge>
                    </div>

                    <div className="text-xs text-stone-700 space-y-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{it.name}</span>
                          <span className="text-stone-300">•</span>
                          <span>
                            {it.quantity} {it.quantityUnit} × {formatINR(it.price)} / {it.priceUnit}
                          </span>
                          <span className="text-stone-300">•</span>
                          <span className="font-semibold text-emerald-800">{formatINR(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        Destination: {order.deliveryAddress?.addressLine}, {order.deliveryAddress?.district},{' '}
                        {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
                      </span>
                    </div>
                  </div>

                  <div className="text-right w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 flex md:flex-col justify-between items-end">
                    <div>
                      <div className="text-xs text-stone-500 font-medium">Total Paid</div>
                      <div className="text-xl font-black text-emerald-800">{formatINR(order.totalAmount)}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================= TRACKING TAB ======================= */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Live Delivery Tracking</h2>
            <p className="text-xs text-stone-500">Monitor active consignments from farm-gate to warehouse</p>
          </div>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 text-xs">
                No orders available for tracking.
              </div>
            ) : (
              orders.map((order) => {
                const steps = [
                  { label: 'Order Placed', completed: true },
                  { label: 'Accepted by Farmer', completed: ['accepted', 'shipped', 'delivered'].includes(order.orderStatus) },
                  { label: 'Dispatched / In Transit', completed: ['shipped', 'delivered'].includes(order.orderStatus) },
                  { label: 'Delivered to Buyer', completed: order.orderStatus === 'delivered' },
                ];

                return (
                  <div key={order._id} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <span className="font-mono font-bold text-sm text-stone-900">{order.orderReference}</span>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {order.items.map((i) => i.name).join(', ')} • Total: {formatINR(order.totalAmount)}
                        </div>
                      </div>
                      <Badge
                        variant={order.orderStatus === 'delivered' ? 'green' : 'blue'}
                        size="sm"
                      >
                        {order.orderStatus.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Stepper */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {steps.map((st, idx) => (
                        <div key={idx} className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-2 w-full">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                st.completed ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500'
                              }`}
                            >
                              {st.completed ? '✓' : idx + 1}
                            </div>
                            <div
                              className={`h-1 flex-1 rounded-full ${
                                st.completed ? 'bg-emerald-500' : 'bg-stone-200'
                              }`}
                            />
                          </div>
                          <span
                            className={`text-[11px] font-semibold mt-1 ${
                              st.completed ? 'text-stone-900' : 'text-stone-400'
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 text-[11px] text-stone-500 bg-stone-50 p-3 rounded-xl flex items-center justify-between">
                      <span>Delivery Location: {order.deliveryAddress?.addressLine}, {order.deliveryAddress?.district}</span>
                      <span className="font-semibold text-emerald-800">Verified Direct Delivery</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================= PAYMENTS TAB ======================= */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Payment History & Invoices</h2>
            <p className="text-xs text-stone-500">Audit trail of transactions, invoices, and settlements</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] bg-stone-50">
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4 text-right">Amount (INR)</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">{o.orderReference}</td>
                      <td className="py-3.5 px-4 text-stone-500">
                        {new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">
                        {o.items.map((it) => `${it.quantity} ${it.quantityUnit} ${it.name}`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-800">
                        {formatINR(o.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={o.paymentStatus === 'successful' ? 'green' : 'amber'} size="sm">
                          {o.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => alert(`Receipt for ${o.orderReference}\nTotal: ₹${o.totalAmount}\nPaid via Gen Baazar Escrow`)}
                          className="text-xs font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
