import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  AlertCircle,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  Search,
  RefreshCw,
  ExternalLink,
  Tag,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import { Product, Order } from '../../types';
import { formatINR } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { ImageUpload } from '../../components/ImageUpload';
import { resolveProductImage } from '../../utils/productImages';
import { DashboardLayout, DashboardNavItem } from '../../components/DashboardLayout';
import { DashboardStatCard } from '../../components/DashboardStatCard';
import { RevenueBarChart, DistributionCard } from '../../components/DashboardCharts';

export const SupplierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('All');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Seeds');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>(180);
  const [priceUnit, setPriceUnit] = useState('pack');
  const [availableQuantity, setAvailableQuantity] = useState<number | ''>(50);
  const [quantityUnit, setQuantityUnit] = useState('pack');
  const [minOrderQuantity, setMinOrderQuantity] = useState(2);
  const [safetyInstructions, setSafetyInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [prodRes, orderRes] = await Promise.all([
        api.get('/products/my/listings'),
        api.get('/orders/seller'),
      ]);
      if (prodRes.data?.success) setProducts(prodRes.data.products);
      if (orderRes.data?.success) setOrders(orderRes.data.orders);
    } catch (err) {
      console.error('Failed to load supplier data:', err);
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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/products', {
        name,
        category,
        description,
        price: Number(price),
        priceUnit,
        availableQuantity: Number(availableQuantity),
        quantityUnit,
        minOrderQuantity: Number(minOrderQuantity),
        safetyInstructions,
        location: {
          district: user?.location?.district || 'Erode',
          state: user?.location?.state || 'Tamil Nadu',
        },
        images: imageUrl ? [imageUrl] : undefined,
      });

      if (res.data?.success) {
        setProducts([res.data.product, ...products]);
        setModalOpen(false);
        setName('');
        setDescription('');
        setSafetyInstructions('');
        setImageUrl('');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to list supplier product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Delete this supply listing?')) return;
    try {
      await api.delete(`/products/${productId}`);
      setProducts(products.filter((p) => p._id !== productId));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { orderStatus: status });
      if (res.data?.success) {
        setOrders(orders.map((o) => (o._id === orderId ? res.data.order : o)));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Metrics
  const totalListings = products.length;
  const totalStockCount = products.reduce((sum, p) => sum + (p.availableQuantity || 0), 0);
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending').length;
  const totalEarningsINR = orders
    .filter((o) => o.paymentStatus === 'successful' || o.orderStatus === 'delivered')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Distribution
  const inputCategoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    const colors = ['bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-rose-500'];
    const total = products.length || 1;
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      value: count,
      color: colors[idx % colors.length],
      percentage: Math.round((count / total) * 100),
    }));
  }, [products]);

  // Revenue trend
  const revenueTrendData = useMemo(() => {
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    return months.map((m, idx) => {
      const amount = (totalEarningsINR / 6) * (0.65 + idx * 0.14);
      return {
        label: m,
        value: Math.round(amount),
      };
    });
  }, [totalEarningsINR]);

  const navItems: DashboardNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'inventory', label: 'Supply Inventory', icon: Package, badge: totalListings },
    {
      id: 'orders',
      label: 'Orders Received',
      icon: ShoppingBag,
      badge: pendingOrders > 0 ? pendingOrders : undefined,
      badgeVariant: 'amber',
    },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [products, searchQuery]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = orderFilter === 'All' || o.orderStatus === orderFilter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [orders, searchQuery, orderFilter]);

  return (
    <DashboardLayout
      roleTitle="Agri Supplier Center"
      roleBadge="Certified Supplier"
      roleBadgeColor="bg-purple-100 text-purple-800"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      navItems={navItems}
      searchPlaceholder="Search seeds, inputs, tools, orders..."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
            title="Refresh inventory"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Agri Input</span>
          </button>
        </div>
      }
    >
      {/* ======================= OVERVIEW TAB ======================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-violet-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs mb-3">
                {user?.farmOrBusinessName || 'Certified Agri Input Depot'} • {user?.location?.district || 'Tamil Nadu'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Empower Farmers with Quality Inputs.
              </h1>
              <p className="text-xs sm:text-sm text-purple-100 mt-2 leading-relaxed">
                Supply certified seeds, bio-fertilizers, organic nutrients, and farming tools directly to local cultivators across Tamil Nadu.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 bg-white text-purple-950 font-bold text-xs rounded-xl hover:bg-purple-50 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-purple-700" />
                  <span>List New Input / Tool</span>
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Package className="w-4 h-4" />
                  <span>Manage Stock</span>
                </button>
              </div>
            </div>
            <Package className="absolute -right-6 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
          </div>

          {/* 4 Core Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <DashboardStatCard
              title="Total Supply Listings"
              value={totalListings}
              icon={Package}
              iconColor="text-purple-700"
              iconBg="bg-purple-100"
              trend={{ value: 9.8, isPositive: true, label: 'vs last season' }}
              actionLabel="View all listings"
              onAction={() => setActiveTab('inventory')}
            />
            <DashboardStatCard
              title="Available Stock Units"
              value={totalStockCount}
              icon={Layers}
              iconColor="text-teal-700"
              iconBg="bg-teal-100"
              subtitle="Packs, bags & pieces in depot"
            />
            <DashboardStatCard
              title="Orders Received"
              value={orders.length}
              icon={ShoppingBag}
              iconColor="text-amber-700"
              iconBg="bg-amber-100"
              trend={
                pendingOrders > 0
                  ? { value: pendingOrders, isPositive: false, label: 'pending fulfillment' }
                  : undefined
              }
              actionLabel="Process orders"
              onAction={() => setActiveTab('orders')}
            />
            <DashboardStatCard
              title="Total Earnings (INR)"
              value={formatINR(totalEarningsINR)}
              icon={TrendingUp}
              iconColor="text-emerald-800"
              iconBg="bg-emerald-100"
              trend={{ value: 24.1, isPositive: true, label: 'growing farm adoption' }}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <RevenueBarChart
                title="Agri Supply Revenue"
                subtitle="Monthly earnings from certified seeds, tools, and bio-nutrients (INR)"
                data={revenueTrendData}
                unit="₹"
              />
            </div>
            <div>
              <DistributionCard
                title="Input Inventory Mix"
                subtitle="Catalog proportion by category"
                totalCount={totalListings}
                totalLabel="Total Inputs"
                items={
                  inputCategoryDistribution.length > 0
                    ? inputCategoryDistribution
                    : [{ name: 'No products yet', value: 0, color: 'bg-stone-300', percentage: 100 }]
                }
              />
            </div>
          </div>

          {/* Recent Orders Snapshot */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">Recent Supply Orders</h3>
                <p className="text-xs text-stone-500">Orders placed by farmers and agricultural cooperatives</p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
              >
                <span>View All ({orders.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-xs">
                No orders received yet. Active supply listings will appear in farmer searches.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Order Ref</th>
                      <th className="py-2.5 px-3">Farmer / Buyer</th>
                      <th className="py-2.5 px-3">Inputs Ordered</th>
                      <th className="py-2.5 px-3 text-right">Total Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order._id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-stone-900">{order.orderReference}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-stone-900">{order.buyerName}</div>
                          <div className="text-[10px] text-stone-400">{order.buyerPhone}</div>
                        </td>
                        <td className="py-3 px-3">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="text-stone-700">
                              {i.quantity} {i.quantityUnit} of {i.name}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-emerald-800">
                          {formatINR(order.totalAmount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge
                            variant={
                              order.orderStatus === 'delivered'
                                ? 'green'
                                : order.orderStatus === 'shipped'
                                ? 'blue'
                                : 'amber'
                            }
                            size="sm"
                          >
                            {order.orderStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {order.orderStatus === 'pending' && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order._id, 'accepted')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              Accept
                            </button>
                          )}
                          {order.orderStatus === 'accepted' && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order._id, 'shipped')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              Dispatch
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

      {/* ======================= INVENTORY TAB ======================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Seeds, Bio-Fertilizers & Tools Inventory ({products.length})
              </h2>
              <p className="text-xs text-stone-500">Manage input stock levels, units, and safety instructions</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Agri Input</span>
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 text-xs">
              <Package className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <p className="font-semibold text-stone-600 text-sm">No supply inputs listed</p>
              <p className="mt-1">Add certified agricultural supplies to your depot.</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>List First Input</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((p) => (
                <div
                  key={p._id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full">
                        {p.category}
                      </span>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                        title="Delete listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="font-bold text-stone-900 text-sm">{p.name}</h3>
                    <p className="text-xs text-stone-500 line-clamp-2">{p.description}</p>

                    {p.safetyInstructions && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200/60 leading-relaxed">
                        <strong className="font-bold">Safety / Application:</strong> {p.safetyInstructions}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <div className="font-black text-emerald-800 text-sm">
                        {formatINR(p.price)} <span className="text-xs font-normal text-stone-500">/ {p.priceUnit}</span>
                      </div>
                      <div className="text-[10px] text-stone-500">
                        In Stock: <strong className="text-stone-800">{p.availableQuantity} {p.quantityUnit}</strong>
                      </div>
                    </div>
                    <Badge variant={p.availableQuantity > 0 ? 'green' : 'red'} size="sm">
                      {p.availableQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= ORDERS TAB ======================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Orders Received ({orders.length})</h2>
              <p className="text-xs text-stone-500">Process farmer requests for agricultural inputs</p>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    orderFilter === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                No orders match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] bg-stone-50">
                      <th className="py-3 px-4">Order Ref</th>
                      <th className="py-3 px-4">Farmer / Buyer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4 text-right">Order Amount</th>
                      <th className="py-3 px-4 text-center">Payment</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-900">{order.orderReference}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-900">{order.buyerName}</div>
                          <div className="text-[10px] text-stone-400">{order.buyerPhone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="text-stone-700">
                              <span className="font-semibold">{i.quantity} {i.quantityUnit}</span> of {i.name}
                            </div>
                          ))}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-800 text-sm">
                          {formatINR(order.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant={order.paymentStatus === 'successful' ? 'green' : 'amber'} size="sm">
                            {order.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant={
                              order.orderStatus === 'delivered'
                                ? 'green'
                                : order.orderStatus === 'shipped'
                                ? 'blue'
                                : 'amber'
                            }
                            size="sm"
                          >
                            {order.orderStatus}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {order.orderStatus === 'pending' && (
                              <button
                                onClick={() => handleOrderStatusUpdate(order._id, 'accepted')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Accept
                              </button>
                            )}
                            {order.orderStatus === 'accepted' && (
                              <button
                                onClick={() => handleOrderStatusUpdate(order._id, 'shipped')}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Mark Dispatched
                              </button>
                            )}
                            {order.orderStatus === 'shipped' && (
                              <button
                                onClick={() => handleOrderStatusUpdate(order._id, 'delivered')}
                                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Mark Delivered
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

      {/* ======================= ADD SUPPLY MODAL ======================= */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="List Agricultural Supply / Tool"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Product Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TNAU Certified Hybrid Teja Chilli Seeds"
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (e.target.value === 'Fertilizers') {
                  setPriceUnit('bag');
                  setQuantityUnit('bag');
                } else if (e.target.value === 'Seeds') {
                  setPriceUnit('pack');
                  setQuantityUnit('pack');
                } else if (e.target.value === 'Agricultural Tools') {
                  setPriceUnit('piece');
                  setQuantityUnit('piece');
                }
              }}
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            >
              <option value="Seeds">Seeds</option>
              <option value="Organic Manure">Organic Manure & Bio-Fertilizers</option>
              <option value="Fertilizers">Fertilizers & Soil Nutrients</option>
              <option value="Pesticides & Crop Protection">Pesticides & Crop Protection</option>
              <option value="Agricultural Tools">Agricultural Tools & Equipment</option>
            </select>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Price (₹ / INR)</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="1"
                  required
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="180"
                  className="w-full p-2 border border-stone-200 rounded-xl bg-white font-bold"
                />
                <select
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  className="p-2 border border-stone-200 rounded-xl bg-white"
                >
                  <option value="pack">/ pack</option>
                  <option value="bag">/ bag</option>
                  <option value="piece">/ piece</option>
                  <option value="kg">/ kg</option>
                  <option value="litre">/ litre</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Available Quantity</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  required
                  min={1}
                  value={availableQuantity}
                  onChange={(e) => setAvailableQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="50"
                  className="w-full p-2 border border-stone-200 rounded-xl bg-white font-bold"
                />
                <select
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value)}
                  className="p-2 border border-stone-200 rounded-xl bg-white"
                >
                  <option value="pack">pack</option>
                  <option value="bag">bag</option>
                  <option value="piece">piece</option>
                  <option value="kg">kg</option>
                  <option value="litre">litre</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Minimum Order Quantity</label>
            <input
              type="number"
              min={1}
              value={minOrderQuantity}
              onChange={(e) => setMinOrderQuantity(Number(e.target.value))}
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Product Photo"
            helperText="Upload a product photo or packaging image"
          />

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Safety & Usage Instructions</label>
            <input
              type="text"
              value={safetyInstructions}
              onChange={(e) => setSafetyInstructions(e.target.value)}
              placeholder="e.g. Wear gloves when handling. Dilute 5ml per litre of water."
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Product Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specifications, certified germination percentage, active ingredients, manufacturer details..."
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
          >
            {submitting ? 'Listing Supply...' : 'Publish to Marketplace'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
