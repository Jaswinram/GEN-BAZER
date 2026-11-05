import React, { useState, useEffect } from 'react';
import { Package, PlusCircle, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { Product, Order } from '../../types';
import { formatINR } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { ImageUpload } from '../../components/ImageUpload';

export const SupplierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
      if (prodRes.data.success) setProducts(prodRes.data.products);
      if (orderRes.data.success) setOrders(orderRes.data.orders);
    } catch (err) {
      console.error('Failed to load supplier data:', err);
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
        safetyInstructions,
        location: {
          district: user?.location.district || 'Erode',
          state: user?.location.state || 'Tamil Nadu',
        },
        images: imageUrl ? [imageUrl] : undefined,
      });

      if (res.data.success) {
        setProducts([res.data.product, ...products]);
        setModalOpen(false);
        setName('');
        setDescription('');
        setSafetyInstructions('');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 uppercase">
            Agricultural Supplier Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-stone-500">
            {user?.farmOrBusinessName || 'Certified Agri Input Supplier'} • {user?.location.district}, {user?.location.state}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Agri Input / Supply</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Active Input Listings</div>
          <div className="text-2xl font-black text-stone-900 mt-1">{products.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Total Orders Received</div>
          <div className="text-2xl font-black text-purple-700 mt-1">{orders.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Pending Orders</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {orders.filter((o) => o.orderStatus === 'pending').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Supply Revenue (INR)</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            {formatINR(orders.reduce((sum, o) => sum + o.totalAmount, 0))}
          </div>
        </div>
      </div>

      {/* Supply Inventory Grid */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-stone-900">Seeds, Bio-Fertilizers & Tools Inventory</h2>

        {products.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs">
            No active agricultural supply products listed yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p._id} className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                      {p.category}
                    </span>
                    <button
                      onClick={() => handleDeleteProduct(p._id)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm mt-2">{p.name}</h3>
                  <div className="text-xs text-stone-500 line-clamp-2 mt-1">{p.description}</div>
                  {p.safetyInstructions && (
                    <div className="mt-2 text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                      <strong>Safety:</strong> {p.safetyInstructions}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-extrabold text-emerald-800 text-sm">
                      {formatINR(p.price)} / {p.priceUnit}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      In Stock: {p.availableQuantity} {p.quantityUnit}
                    </div>
                  </div>
                  <Badge variant={p.availableQuantity > 0 ? 'green' : 'red'} size="sm">
                    {p.availableQuantity > 0 ? 'Available' : 'Out of Stock'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD SUPPLY INPUT MODAL */}
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

          <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Price (₹ / INR)</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  required
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border border-stone-200 rounded-xl bg-white font-bold"
                />
                <select
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  className="p-2 border border-stone-200 rounded-xl bg-white"
                >
                  <option value="pack">/ pack</option>
                  <option value="bag">/ bag</option>
                  <option value="kg">/ kg</option>
                  <option value="litre">/ litre</option>
                  <option value="piece">/ piece</option>
                  <option value="bottle">/ bottle</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Stock Quantity</label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  required
                  min={1}
                  value={availableQuantity}
                  onChange={(e) => setAvailableQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border border-stone-200 rounded-xl bg-white font-bold"
                />
                <select
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value)}
                  className="p-2 border border-stone-200 rounded-xl bg-white"
                >
                  <option value="pack">pack</option>
                  <option value="bag">bag</option>
                  <option value="kg">kg</option>
                  <option value="litre">litre</option>
                  <option value="piece">piece</option>
                  <option value="bottle">bottle</option>
                </select>
              </div>
            </div>
          </div>

          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Product / Package Photo"
            helperText="Upload a clear photo of the seed packet, fertilizer bag, or tool label."
          />

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Safety & Usage Instructions (Mandatory for chemical/regulated inputs)
            </label>
            <input
              type="text"
              value={safetyInstructions}
              onChange={(e) => setSafetyInstructions(e.target.value)}
              placeholder="e.g. Wear protective goggles and gloves. Keep away from domestic animals and food grains."
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
              placeholder="Specify germination purity, active ingredients, batch license, and application dosage..."
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
          >
            {submitting ? 'Listing Input...' : 'Publish Supply to Marketplace'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

