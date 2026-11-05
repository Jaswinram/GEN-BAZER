import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  PlusCircle,
  Package,
  ShoppingBag,
  TrendingUp,
  Trash2,
  Wrench,
  Truck,
  Check,
  AlertCircle,
  Clock,
} from 'lucide-react';
import api from '../../services/api';
import { Product, Order } from '../../types';
import { formatINR } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { ImageUpload } from '../../components/ImageUpload';
import { resolveProductImage } from '../../utils/productImages';

export const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (orderRes.data.success) setOrders(orderRes.data.orders);
    } catch (err) {
      console.error('Failed to load farmer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
          district: user?.location.district || 'Coimbatore',
          state: user?.location.state || 'Tamil Nadu',
        },
        images: imageUrl ? [imageUrl] : undefined,
      });

      if (res.data.success) {
        setProducts([res.data.product, ...products]);
        setModalOpen(false);
        // Reset form
        setName('');
        setDescription('');
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
      if (res.data.success) {
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

  // Metrics calculation
  const totalSalesINR = orders
    .filter((o) => o.paymentStatus === 'successful' || o.orderStatus === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
              Farmer Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-stone-500">
            {user?.farmOrBusinessName || 'Direct Cultivator'} • {user?.location.district}, {user?.location.state}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List Harvest Produce</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Active Harvest Listings</div>
          <div className="text-2xl font-black text-stone-900 mt-1">{products.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Pending Orders</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingOrdersCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Completed Deliveries</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {orders.filter((o) => o.orderStatus === 'delivered').length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Total Produce Sales (INR)</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{formatINR(totalSalesINR)}</div>
        </div>
      </div>

      {/* Quick Machinery & Transport Finder Callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/machinery"
          className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between hover:bg-emerald-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-emerald-950 text-xs sm:text-sm">Need a Tractor or Harvester?</div>
              <div className="text-[11px] text-emerald-800">Rent nearby machinery on-demand per hour or acre</div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800">Browse →</span>
        </Link>

        <Link
          to="/transport"
          className="p-4 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-blue-950 text-xs sm:text-sm">Produce Ready for Mandi?</div>
              <div className="text-[11px] text-blue-800">Book mini trucks or maxis for farm gate pickup</div>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-800">Dispatch →</span>
        </Link>
      </div>

      {/* Orders Received Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-stone-900">Orders Received from Buyers</h2>

        {orders.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs">
            No buyer orders received yet. Active listings will appear in buyer searches.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Order Ref</th>
                  <th className="py-2.5 px-3">Buyer</th>
                  <th className="py-2.5 px-3">Produce Items</th>
                  <th className="py-2.5 px-3 text-right">Order Total (INR)</th>
                  <th className="py-2.5 px-3 text-center">Payment</th>
                  <th className="py-2.5 px-3 text-center">Fulfillment Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-stone-50">
                    <td className="py-3 px-3 font-mono font-bold text-stone-800">
                      {order.orderReference}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-stone-900">{order.buyerName}</div>
                      <div className="text-[11px] text-stone-400">{order.buyerPhone}</div>
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
                      <Badge variant={order.paymentStatus === 'successful' ? 'green' : 'amber'} size="sm">
                        {order.paymentStatus}
                      </Badge>
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
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold"
                        >
                          Accept
                        </button>
                      )}
                      {order.orderStatus === 'accepted' && (
                        <button
                          onClick={() => handleOrderStatusUpdate(order._id, 'shipped')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold"
                        >
                          Mark Shipped
                        </button>
                      )}
                      {order.orderStatus === 'shipped' && (
                        <button
                          onClick={() => handleOrderStatusUpdate(order._id, 'delivered')}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-semibold"
                        >
                          Mark Delivered
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

      {/* My Farm Harvest Listings */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-stone-900">My Farm Listings</h2>

        {products.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs">
            No active listings. Click "List Harvest Produce" to begin selling!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p._id} className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {p.category}
                    </span>
                    <button
                      onClick={() => handleDeleteProduct(p._id)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                      title="Delete listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="w-full aspect-16/10 rounded-xl overflow-hidden bg-stone-100 mb-2">
                    <img
                      src={resolveProductImage(p.name, p.category, p.images)}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/categories/vegetables.jpg';
                      }}
                    />
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">{p.name}</h3>
                  <div className="text-xs text-stone-500 line-clamp-2 mt-1">{p.description}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-extrabold text-emerald-700 text-sm">
                      {formatINR(p.price)} / {p.priceUnit}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      Stock: {p.availableQuantity} {p.quantityUnit}
                    </div>
                  </div>

                  <Link
                    to={`/products/${p._id}`}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    View Card
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD PRODUCE MODAL */}
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
    </div>
  );
};

