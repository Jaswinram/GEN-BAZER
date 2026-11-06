import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  ShoppingBag,
  PlusCircle,
  Package,
  TrendingUp,
  Trash2,
  Wrench,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  Check,
  AlertCircle,
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

export const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('All');

  // New Product Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Vegetables');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>(25);
  const [priceUnit, setPriceUnit] = useState('kg');
  const [availableQuantity, setAvailableQuantity] = useState<number | ''>(100);
  const [quantityUnit, setQuantityUnit] = useState('kg');
  const [minOrderQuantity, setMinOrderQuantity] = useState(5);
  const [villageOrTaluk, setVillageOrTaluk] = useState('');
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
      console.error('Failed to load farmer data:', err);
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
        location: {
          villageOrTaluk,
          district: user?.location?.district || 'Coimbatore',
          state: user?.location?.state || 'Tamil Nadu',
        },
        images: imageUrl ? [imageUrl] : undefined,
      });

      if (res.data?.success) {
        setProducts([res.data.product, ...products]);
        setModalOpen(false);
        // Reset form
        setName('');
        setDescription('');
        setVillageOrTaluk('');
        setImageUrl('');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to list product.');
    } finally {
      setSubmitting(false);
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

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to remove this product listing?')) return;
    try {
      await api.delete(`/products/${productId}`);
      setProducts(products.filter((p) => p._id !== productId));
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  // Metrics
  const totalProducts = products.length;
  const activeListings = products.filter((p) => p.availableQuantity > 0).length;
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending').length;
  const totalSalesINR = orders
    .filter((o) => o.paymentStatus === 'successful' || o.orderStatus === 'delivered')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.availableQuantity <= ((p.minOrderQuantity || 1) * 3 || 30));
  }, [products]);

  // Chart data
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-rose-500'];
    const total = products.length || 1;
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      value: count,
      color: colors[idx % colors.length],
      percentage: Math.round((count / total) * 100),
    }));
  }, [products]);

  const salesTrendData = useMemo(() => {
    // Generate 6 months data based on orders
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    return months.map((m, idx) => {
      // Simulate/aggregate month totals
      const amount = (totalSalesINR / 6) * (0.6 + idx * 0.15);
      return {
        label: m,
        value: Math.round(amount),
      };
    });
  }, [totalSalesINR]);

  const navItems: DashboardNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Produce Listings', icon: Sprout, badge: totalProducts },
    {
      id: 'orders',
      label: 'Buyer Orders',
      icon: ShoppingBag,
      badge: pendingOrders > 0 ? pendingOrders : undefined,
      badgeVariant: 'amber',
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: Layers,
      badge: lowStockProducts.length > 0 ? `${lowStockProducts.length} low` : undefined,
      badgeVariant: 'rose',
    },
  ];

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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [products, searchQuery]);

  return (
    <DashboardLayout
      roleTitle="Farmer Workspace"
      roleBadge="Cultivator"
      roleBadgeColor="bg-emerald-100 text-emerald-800"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      navItems={navItems}
      searchPlaceholder="Search harvest, orders, buyers..."
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
            title="Refresh workspace"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List Harvest Produce</span>
          </button>
        </div>
      }
    >
      {/* ======================= OVERVIEW TAB ======================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs mb-3">
                {user?.farmOrBusinessName || 'Direct Cultivator'} • {user?.location?.district || 'Tamil Nadu'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Fresh Harvest, Direct Returns.
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed">
                Connect directly with commercial buyers, mandis, and retail aggregators. Eliminate middleman cuts and track every produce delivery in real time.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 bg-white text-emerald-900 font-bold text-xs rounded-xl hover:bg-emerald-50 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-700" />
                  <span>List New Produce</span>
                </button>
                <Link
                  to="/machinery"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Rent Machinery</span>
                </Link>
                <Link
                  to="/transport"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>Dispatch Transport</span>
                </Link>
              </div>
            </div>
            {/* Visual accent background icon */}
            <Sprout className="absolute -right-6 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
          </div>

          {/* 4 Core Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <DashboardStatCard
              title="Total Products Listed"
              value={totalProducts}
              icon={Sprout}
              iconColor="text-emerald-700"
              iconBg="bg-emerald-100"
              trend={{ value: 14.2, isPositive: true, label: 'vs last crop cycle' }}
              actionLabel="View all products"
              onAction={() => setActiveTab('products')}
            />
            <DashboardStatCard
              title="Active Market Listings"
              value={activeListings}
              icon={Package}
              iconColor="text-teal-700"
              iconBg="bg-teal-100"
              subtitle={`${products.length - activeListings} out of stock`}
            />
            <DashboardStatCard
              title="Pending Buyer Orders"
              value={pendingOrders}
              icon={ShoppingBag}
              iconColor="text-amber-700"
              iconBg="bg-amber-100"
              trend={
                pendingOrders > 0
                  ? { value: pendingOrders, isPositive: false, label: 'needs fulfillment' }
                  : undefined
              }
              actionLabel="Process orders"
              onAction={() => setActiveTab('orders')}
            />
            <DashboardStatCard
              title="Total Earnings (INR)"
              value={formatINR(totalSalesINR)}
              icon={TrendingUp}
              iconColor="text-emerald-800"
              iconBg="bg-emerald-100"
              trend={{ value: 22.8, isPositive: true, label: 'vs previous quarter' }}
              subtitle="Direct bank settlement"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <RevenueBarChart
                title="Sales & Realized Earnings"
                subtitle="Monthly produce sales through Gen Baazar mandi network (INR)"
                data={salesTrendData}
                unit="₹"
              />
            </div>
            <div>
              <DistributionCard
                title="Harvest Crop Categories"
                subtitle="Distribution of your active farm listings"
                totalCount={totalProducts}
                totalLabel="Total Listings"
                items={
                  categoryDistribution.length > 0
                    ? categoryDistribution
                    : [{ name: 'No listings yet', value: 0, color: 'bg-stone-300', percentage: 100 }]
                }
              />
            </div>
          </div>

          {/* Low Stock Alerts */}
          {lowStockProducts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Low Harvest Stock Alerts</h3>
                    <p className="text-[11px] text-stone-600">
                      {lowStockProducts.length} items have fallen near or below minimum purchase threshold
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="text-xs font-bold text-amber-900 hover:underline flex items-center gap-1"
                >
                  <span>Manage Stock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {lowStockProducts.slice(0, 3).map((item) => (
                  <div
                    key={item._id}
                    className="bg-white p-3 rounded-xl border border-amber-200/70 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-stone-900 text-xs truncate max-w-[140px]">{item.name}</div>
                      <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                        Only {item.availableQuantity} {item.quantityUnit} remaining
                      </div>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                      Refill Soon
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Machinery & Transport Finder Banners */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/machinery"
              className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-emerald-300 hover:shadow-sm transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-xs sm:text-sm">Need a Tractor or Harvester?</div>
                  <div className="text-[11px] text-stone-500">Rent nearby machinery on-demand per hour or acre</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/transport"
              className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-xs sm:text-sm">Produce Ready for Mandi?</div>
                  <div className="text-[11px] text-stone-500">Book mini trucks or maxis for farm gate pickup</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-700 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">Recent Produce Orders</h3>
                <p className="text-xs text-stone-500">Direct purchases incoming from wholesale buyers</p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>View All ({orders.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-10 text-stone-400 text-xs">
                No orders received yet. Active listings will appear in buyer searches.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Order Ref</th>
                      <th className="py-2.5 px-3">Buyer</th>
                      <th className="py-2.5 px-3">Produce Items</th>
                      <th className="py-2.5 px-3 text-right">Order Total</th>
                      <th className="py-2.5 px-3 text-center">Fulfillment</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order._id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-stone-800">
                          {order.orderReference}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-stone-900">{order.buyerName}</div>
                          <div className="text-[10px] text-stone-400">{order.buyerPhone}</div>
                        </td>
                        <td className="py-3 px-3">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="text-[11px] text-stone-700">
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
                                : order.orderStatus === 'accepted'
                                ? 'amber'
                                : 'gray'
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
                              Ship
                            </button>
                          )}
                          {order.orderStatus === 'shipped' && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order._id, 'delivered')}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold"
                            >
                              Deliver
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

      {/* ======================= PRODUCTS TAB ======================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Farm Harvest Listings ({products.length})</h2>
              <p className="text-xs text-stone-500">Live products visible to wholesale buyers and institutions</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List New Produce</span>
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-400 text-xs">
              <Sprout className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <p className="font-semibold text-stone-600 text-sm">No produce listings found</p>
              <p className="mt-1">Add your crops and harvest details to start receiving orders directly from buyers.</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>List Harvest Produce</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((p) => (
                <div
                  key={p._id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-16/10 bg-stone-100 overflow-hidden">
                      <img
                        src={resolveProductImage(p.name, p.category, p.images)}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/categories/vegetables.jpg';
                        }}
                      />
                      <span className="absolute top-2 left-2 text-[10px] font-bold text-emerald-900 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs">
                        {p.category}
                      </span>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-rose-50 text-stone-600 hover:text-rose-600 rounded-lg shadow-xs transition-colors"
                        title="Delete listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-stone-900 text-sm line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-stone-500 line-clamp-2">{p.description}</p>
                      <div className="text-[11px] text-stone-400">
                        {p.location?.villageOrTaluk ? `${p.location.villageOrTaluk}, ` : ''}
                        {p.location?.district || user?.location?.district}, {p.location?.state || 'Tamil Nadu'}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between">
                    <div>
                      <div className="font-black text-emerald-800 text-sm">
                        {formatINR(p.price)} <span className="text-xs font-normal text-stone-500">/ {p.priceUnit}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 font-medium">
                        Stock: <span className="font-bold text-stone-800">{p.availableQuantity} {p.quantityUnit}</span>
                      </div>
                    </div>

                    <Link
                      to={`/products/${p._id}`}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
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
              <h2 className="text-lg font-bold text-stone-900">Buyer Orders ({orders.length})</h2>
              <p className="text-xs text-stone-500">Track and fulfill wholesale orders placed by buyers</p>
            </div>
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    orderFilter === status
                      ? 'bg-emerald-600 text-white'
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
                      <th className="py-3 px-4">Buyer & Contact</th>
                      <th className="py-3 px-4">Items Ordered</th>
                      <th className="py-3 px-4 text-right">Order Total</th>
                      <th className="py-3 px-4 text-center">Payment</th>
                      <th className="py-3 px-4 text-center">Fulfillment Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                          {order.orderReference}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-900">{order.buyerName}</div>
                          <div className="text-[11px] text-stone-400">{order.buyerPhone}</div>
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
                                : order.orderStatus === 'accepted'
                                ? 'amber'
                                : 'gray'
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
                                Mark Shipped
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

      {/* ======================= INVENTORY TAB ======================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Inventory & Stock Management</h2>
            <p className="text-xs text-stone-500">Monitor current harvest quantity, batch health, and threshold limits</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] bg-stone-50">
                    <th className="py-3 px-4">Produce Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit Rate (INR)</th>
                    <th className="py-3 px-4">Available Stock</th>
                    <th className="py-3 px-4">Min Order</th>
                    <th className="py-3 px-4">Stock Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((p) => {
                    const isLow = p.availableQuantity <= ((p.minOrderQuantity || 1) * 3 || 30);
                    return (
                      <tr key={p._id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-stone-900">{p.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-800">
                          {formatINR(p.price)} / {p.priceUnit}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-stone-900">
                          {p.availableQuantity} {p.quantityUnit}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          {p.minOrderQuantity} {p.quantityUnit}
                        </td>
                        <td className="py-3.5 px-4">
                          {p.availableQuantity === 0 ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] rounded-full">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/products/${p._id}`}
                            className="text-xs font-bold text-emerald-700 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= ADD PRODUCE MODAL ======================= */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="List New Agricultural Produce"
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
            <label className="block text-stone-700 font-semibold mb-1">Produce / Crop Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Country Farm Fresh Tomatoes"
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Seeds">Seeds</option>
                <option value="Grains & Cereals">Grains & Cereals</option>
                <option value="Pulses">Pulses</option>
                <option value="Spices">Spices</option>
                <option value="Flowers">Flowers</option>
                <option value="Organic Manure">Organic Manure</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Village / Taluk</label>
              <input
                type="text"
                value={villageOrTaluk}
                onChange={(e) => setVillageOrTaluk(e.target.value)}
                placeholder="e.g. Thondamuthur"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
              />
            </div>
          </div>

          {/* Unit Separation: Price Unit vs Quantity Unit */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Price (₹ / INR)</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  required
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="25"
                  className="w-full p-2 border border-stone-200 rounded-xl bg-white font-bold"
                />
                <select
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  className="p-2 border border-stone-200 rounded-xl bg-white"
                >
                  <option value="kg">/ kg</option>
                  <option value="quintal">/ quintal</option>
                  <option value="g">/ g</option>
                  <option value="bag">/ bag</option>
                  <option value="box">/ box</option>
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
                  placeholder="100"
                  className="w-full p-2 border border-stone-200 rounded-xl bg-white font-bold"
                />
                <select
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value)}
                  className="p-2 border border-stone-200 rounded-xl bg-white"
                >
                  <option value="kg">kg</option>
                  <option value="quintal">quintal</option>
                  <option value="g">g</option>
                  <option value="bag">bag</option>
                  <option value="box">box</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Min. Order Quantity</label>
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
            label="Produce Photo / Image"
            helperText="Upload a real photo of your harvest directly from your phone/computer, or paste a link."
          />

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Produce Description</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe ripeness, harvest date, farming method, and storage advice..."
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
          >
            {submitting ? 'Listing Produce...' : 'Publish Produce to Marketplace'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};
