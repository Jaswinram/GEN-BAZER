import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Sprout,
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
  Scale,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  ShoppingCart,
  Package,
  X,
  RotateCcw,
} from 'lucide-react';
import api from '../services/api';
import { Product, Order } from '../types';
import { formatINR, calculateLineTotal } from '../utils/currency';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { VoiceSearch } from '../components/VoiceSearch';
import { resolveProductImage } from '../utils/productImages';

// 8 Verified Agricultural Categories + 'All'
const ALL_AGRICULTURAL_CATEGORIES = [
  { id: 'All', name: 'All Produce', desc: 'Browse complete catalog', image: '/categories/vegetables.jpg' },
  { id: 'Vegetables', name: 'Vegetables', desc: 'Tomato, onion & greens', image: '/categories/vegetables.jpg' },
  { id: 'Fruits', name: 'Fruits', desc: 'Mango, banana & coconut', image: '/categories/fruits.jpg' },
  { id: 'Seeds', name: 'Seeds', desc: 'Paddy, chilli & groundnut', image: '/categories/seeds.jpg' },
  { id: 'Grains & Cereals', name: 'Grains & Cereals', desc: 'Rice, wheat & ragi', image: '/categories/grains.jpg' },
  { id: 'Pulses', name: 'Pulses', desc: 'Toor dal, moong & chana', image: '/categories/pulses.jpg' },
  { id: 'Spices', name: 'Spices', desc: 'Turmeric, ginger & chilli', image: '/categories/spices.jpg' },
  { id: 'Flowers', name: 'Flowers', desc: 'Madurai jasmine & rose', image: '/categories/flowers.jpg' },
  { id: 'Organic Manure', name: 'Organic Manure', desc: 'Neem cake & vermicompost', image: '/categories/organic_manure.jpg' },
];

export const Products: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active view tab: marketplace browse or user orders
  const [activeTab, setActiveTab] = useState<'browse' | 'my_orders'>('browse');

  // Products listings and filters
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [districtFilter, setDistrictFilter] = useState(searchParams.get('district') || 'All');
  const [sellerRoleFilter, setSellerRoleFilter] = useState(searchParams.get('sellerRole') || 'All');
  const [availabilityFilter, setAvailabilityFilter] = useState(searchParams.get('stockOnly') || 'All');
  const [minPrice, setMinPrice] = useState<number | ''>(searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : '');
  const [maxPrice, setMaxPrice] = useState<number | ''>(searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modals state
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Order / Purchase Form State
  const [orderQuantity, setOrderQuantity] = useState<number>(5);
  const [buyerName, setBuyerName] = useState(user?.name || '');
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.location?.address || '');
  const [notes, setNotes] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // My Orders State
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (user) {
      if (!buyerName) setBuyerName(user.name);
      if (!buyerPhone) setBuyerPhone(user.phone || '');
      if (!deliveryAddress && user.location?.address) setDeliveryAddress(user.location.address);
    }
  }, [user]);

  // Fetch Products Listings
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (selectedCategory && selectedCategory !== 'All') query.append('category', selectedCategory);
      if (districtFilter && districtFilter !== 'All') query.append('district', districtFilter);
      if (sellerRoleFilter && sellerRoleFilter !== 'All') query.append('sellerRole', sellerRoleFilter);
      if (minPrice !== '') query.append('minPrice', String(minPrice));
      if (maxPrice !== '') query.append('maxPrice', String(maxPrice));
      if (availabilityFilter === 'in_stock') query.append('stockOnly', 'true');
      if (sortBy) query.append('sort', sortBy);
      query.append('limit', '50');

      const res = await api.get(`/products?${query.toString()}`);
      if (res.data.success) {
        // Strict guard: ensure tools and machinery never leak onto this page
        const agriProduce = res.data.products.filter(
          (p: Product) =>
            p.category !== 'Agricultural Tools' &&
            p.category !== 'Machinery' &&
            p.category !== 'Tractors'
        );
        setProducts(agriProduce);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, districtFilter, sellerRoleFilter, availabilityFilter, sortBy]);

  // Fetch User Orders
  const fetchMyOrders = async () => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders/my');
      if (res.data.success) {
        setMyOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to load user orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my_orders') {
      fetchMyOrders();
    }
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleVoiceSearch = (transcript: string) => {
    setSearch(transcript);
  };

  const handleOpenBuyNow = (product: Product) => {
    setSelectedProduct(product);
    setOrderQuantity(product.minOrderQuantity || 1);
    setOrderError(null);
    setOrderSuccess(null);
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setOrderSubmitting(true);
    setOrderError(null);

    try {
      const result = addToCart(selectedProduct, Number(orderQuantity) || 1);
      if (result.success) {
        setOrderSuccess(`Added ${orderQuantity} ${selectedProduct.quantityUnit} of ${selectedProduct.name} to your cart!`);
        setTimeout(() => {
          setOrderSuccess(null);
          setSelectedProduct(null);
          navigate('/cart');
        }, 1200);
      } else {
        setOrderError(result.message);
      }
    } catch (err: any) {
      setOrderError(err.message || 'Failed to process order.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const calculatedTotal = selectedProduct
    ? calculateLineTotal(selectedProduct.price, Number(orderQuantity) || 1)
    : 0;

  const resetAllFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setDistrictFilter('All');
    setSellerRoleFilter('All');
    setAvailabilityFilter('All');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('popular');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* SECTION 1: PAGE BANNER & TITLE (Identical design & theme as Machinery Rentals) */}
      <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 rounded-3xl p-6 sm:p-10 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/60 backdrop-blur-xs text-emerald-100 text-xs font-semibold">
            <Sprout className="w-3.5 h-3.5" />
            <span>Farm-Fresh Agricultural Marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Agricultural Marketplace
          </h1>
          <p className="text-sm sm:text-base text-emerald-100">
            Direct farm-fresh harvests, certified seeds, grains, pulses, spices, flowers, and organic manure with genuine farm photographs in Indian Rupees (₹ / INR).
          </p>
        </div>

        {/* Tab Switcher & Farmer / Supplier Dashboard Link */}
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
              Browse Produce Catalog
            </button>
            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('my_orders')}
                className={`px-4 py-1.5 rounded-lg transition-all ${
                  activeTab === 'my_orders'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                My Orders
              </button>
            )}
          </div>

          <button
            onClick={() => {
              if (!isAuthenticated) navigate('/login');
              else if (user?.role === 'supplier') navigate('/dashboard/supplier');
              else navigate('/dashboard/farmer');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-emerald-700" />
            <span>Sell Your Products (Farmer Dashboard)</span>
          </button>
        </div>

        {/* Search & Quick Filter Bar */}
        {activeTab === 'browse' && (
          <form
            onSubmit={handleSearchSubmit}
            className="relative z-10 mt-6 bg-white p-4 sm:p-5 rounded-2xl shadow-xl border border-stone-200 text-stone-900 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="lg:col-span-2 relative">
                <label className="block font-bold text-stone-700 mb-1">Search Farm Produce</label>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by crop, variety, seed type, spices, farmer..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-hidden focus:border-emerald-500 font-medium"
                  />
                  <div className="absolute right-2.5">
                    <VoiceSearch onSearch={handleVoiceSearch} />
                  </div>
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
                  <option value="Madurai">Madurai</option>
                  <option value="Dharmapuri">Dharmapuri</option>
                  <option value="Theni">Theni</option>
                  <option value="Chennai">Chennai APMC</option>
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
                  title="Advanced Price, Seller & Category Filters"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Advanced Filters Expandable Drawer */}
            {showAdvancedFilters && (
              <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-stone-600 font-bold mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50"
                  >
                    {ALL_AGRICULTURAL_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">Seller Type</label>
                  <select
                    value={sellerRoleFilter}
                    onChange={(e) => setSellerRoleFilter(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50"
                  >
                    <option value="All">All Sellers</option>
                    <option value="farmer">Direct Farmers</option>
                    <option value="supplier">Agri Suppliers</option>
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
                    <option value="in_stock">In Stock Only</option>
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
                    <option value="popular">Popular</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="newest">Newest Listings</option>
                  </select>
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      {/* VIEW 1: BROWSE PRODUCE CATALOG */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* SECTION 2: 8 AGRICULTURAL CATEGORY CARDS WITH MATCHING PHOTOGRAPHS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Select Product Category
                </h2>
                <p className="text-xs text-stone-500">
                  Showing verified Indian farm produce photographs. Never generic images.
                </p>
              </div>

              {selectedCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
                >
                  <span>Showing: {selectedCategory} (Clear Filter)</span>
                </button>
              )}
            </div>

            {/* 8 Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-2.5">
              {ALL_AGRICULTURAL_CATEGORIES.map((cat) => {
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
                          (e.target as HTMLImageElement).src = '/categories/vegetables.jpg';
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

          {/* SECTION 3: PRODUCT LISTINGS GRID */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-700">
                Available Farm Produce Listings ({products.length})
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
            ) : products.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
                <Sprout className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="text-base font-bold text-stone-800">No agricultural produce matches your search</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Try clearing your search query or selecting a different crop category.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    onViewDetails={(item) => setDetailsProduct(item)}
                    onBuyNow={(item) => handleOpenBuyNow(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: MY ORDERS TAB */}
      {activeTab === 'my_orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              My Agricultural Orders
            </h2>
            <button
              onClick={fetchMyOrders}
              className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Orders</span>
            </button>
          </div>

          {loadingOrders ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-40 bg-stone-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : myOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
              <Package className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">No orders placed yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Explore our farm catalog, add fresh harvests or seeds to your cart, and place your first order.
              </p>
              <button
                onClick={() => setActiveTab('browse')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myOrders.map((order) => (
                <div
                  key={order._id}
                  className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div>
                      <span className="text-[11px] text-stone-400 font-medium">Order Reference</span>
                      <h4 className="font-bold text-sm text-stone-900">#{order.orderReference}</h4>
                    </div>
                    <Badge
                      variant={
                        order.status === 'delivered'
                          ? 'green'
                          : order.status === 'cancelled'
                          ? 'red'
                          : 'amber'
                      }
                      size="sm"
                    >
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-stone-700">
                        <span className="font-medium truncate max-w-[200px]">
                          {item.name} × {item.quantity} {item.quantityUnit}
                        </span>
                        <span className="font-bold text-emerald-800">{formatINR(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-stone-400 block text-[11px]">Total Paid (₹)</span>
                      <span className="font-extrabold text-sm text-emerald-800">
                        {formatINR(order.totalAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-400 block text-[11px]">Destination</span>
                      <span className="font-semibold text-stone-700 flex items-center gap-1 justify-end">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {order.deliveryAddress?.district || 'Tamil Nadu'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW DETAILS MODAL (Matching Details Modal in Machinery.tsx) */}
      {detailsProduct && (
        <Modal
          isOpen={!!detailsProduct}
          onClose={() => setDetailsProduct(null)}
          title={detailsProduct.name}
        >
          <div className="space-y-4 text-xs">
            <div className="aspect-16/9 bg-stone-100 rounded-xl overflow-hidden relative">
              <img
                src={resolveProductImage(detailsProduct.name, detailsProduct.category, detailsProduct.images)}
                alt={detailsProduct.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/categories/vegetables.jpg';
                }}
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize">
                  {detailsProduct.category}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[11px] text-stone-500">Mandi Price</div>
                <div className="text-base font-bold text-emerald-800">
                  {formatINR(detailsProduct.price)} / {detailsProduct.priceUnit}
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-[11px] text-stone-500">Farm Location</div>
                <div className="text-sm font-bold text-stone-900">
                  {detailsProduct.location?.villageOrTaluk ? `${detailsProduct.location.villageOrTaluk}, ` : ''}
                  {detailsProduct.location?.district || 'Coimbatore'}, {detailsProduct.location?.state || 'TN'}
                </div>
              </div>
            </div>

            <div>
              <span className="font-bold text-stone-800">Produce Description</span>
              <p className="text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100 mt-1">
                {detailsProduct.description}
              </p>
            </div>

            {/* Specifications */}
            <div className="space-y-1">
              <span className="font-bold text-stone-800">Specifications & Stock</span>
              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100">
                <div>Available Stock: <strong>{detailsProduct.availableQuantity} {detailsProduct.quantityUnit}</strong></div>
                <div>Min Order Quantity: <strong>{detailsProduct.minOrderQuantity || 1} {detailsProduct.quantityUnit}</strong></div>
                <div>Seller Type: <strong className="capitalize">{detailsProduct.sellerRole}</strong></div>
                <div>Payment Mode: <strong>Cash on Mandi / UPI</strong></div>
              </div>
            </div>

            {/* Handling / Safety Rules */}
            {detailsProduct.safetyInstructions && (
              <div className="space-y-1">
                <span className="font-bold text-stone-800">Handling & Storage Instructions</span>
                <p className="text-stone-600 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                  {detailsProduct.safetyInstructions}
                </p>
              </div>
            )}

            {/* Seller Contact */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-500 block">Producer / Seller</span>
                <span className="font-bold text-stone-900 text-sm">{detailsProduct.sellerName}</span>
              </div>
              {detailsProduct.sellerPhone && (
                <a
                  href={`tel:${detailsProduct.sellerPhone}`}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Seller</span>
                </a>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDetailsProduct(null)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = detailsProduct;
                  setDetailsProduct(null);
                  handleOpenBuyNow(p);
                }}
                disabled={detailsProduct.availableQuantity <= 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs flex items-center gap-1"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Buy This Produce</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* SECTION 4: BUY NOW / ORDER MODAL (Matching Booking Modal in Machinery.tsx) */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={`Order: ${selectedProduct.name}`}
        >
          {orderSuccess ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-stone-900">Produce Added to Cart!</h4>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">{orderSuccess}</p>
              <div className="text-[11px] text-stone-400">Redirecting to cart checkout...</div>
            </div>
          ) : (
            <form onSubmit={handleConfirmOrder} className="space-y-4 text-xs">
              {/* Product Header with Photo */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                <div className="w-16 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                  <img
                    src={resolveProductImage(selectedProduct.name, selectedProduct.category, selectedProduct.images)}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-stone-900 text-sm truncate">{selectedProduct.name}</h4>
                  <div className="text-[11px] text-emerald-800 font-semibold">
                    {formatINR(selectedProduct.price)} / {selectedProduct.priceUnit}
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Seller: {selectedProduct.sellerName} • {selectedProduct.location?.district}
                  </div>
                </div>
              </div>

              {orderError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              {/* Quantity Selection */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Required Quantity ({selectedProduct.quantityUnit})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={selectedProduct.minOrderQuantity || 1}
                    max={selectedProduct.availableQuantity}
                    required
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-32 p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-bold text-sm"
                  />
                  <div className="text-[11px] text-stone-500">
                    Min: {selectedProduct.minOrderQuantity || 1} {selectedProduct.quantityUnit} (Max: {selectedProduct.availableQuantity})
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-medium"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Delivery Destination / Mandi Address
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Daily Market Road, Thondamuthur, Coimbatore"
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-medium"
                />
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Special Packing or Delivery Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Deliver before 7:00 AM, pack in 25kg aerated bags"
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-medium"
                />
              </div>

              {/* Price Calculation Summary */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex justify-between text-stone-600">
                  <span>Unit Price:</span>
                  <span>{formatINR(selectedProduct.price)} / {selectedProduct.priceUnit}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Quantity:</span>
                  <span>{orderQuantity} {selectedProduct.quantityUnit}</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-stone-900">
                  <span>Estimated Total (₹ INR):</span>
                  <span className="text-emerald-800 text-base">{formatINR(calculatedTotal)}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{orderSubmitting ? 'Adding...' : 'Add to Cart & Checkout'}</span>
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
