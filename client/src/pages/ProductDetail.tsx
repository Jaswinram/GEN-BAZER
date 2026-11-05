import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Phone,
  AlertCircle,
  Check,
  ArrowLeft,
  Flag,
  Share2,
  Package,
} from 'lucide-react';
import api from '../services/api';
import { Product } from '../types';
import { formatINR, calculateLineTotal } from '../utils/currency';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { resolveProductImage } from '../utils/productImages';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data.success) {
          setProduct(res.data.product);
          setQuantity(res.data.product.minOrderQuantity || 1);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-96 bg-stone-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-800">Product not found</h2>
        <p className="text-xs text-stone-500">The agricultural listing you requested is unavailable or has been removed.</p>
        <Link to="/products" className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stockStatus === 'out_of_stock' || product.availableQuantity <= 0;
  const currentSubtotal = calculateLineTotal(product.price, quantity);

  const handleAddToCart = () => {
    const res = addToCart(product, quantity);
    if (res.success) {
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 3000);
    } else {
      alert(res.message);
    }
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await api.post('/admin/reports', {
        targetType: 'product',
        targetId: product._id,
        targetTitle: product.name,
        reason: reportReason,
        details: reportDetails,
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setReportSubmitted(false);
        setReportModalOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit report:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Agricultural Listings</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs">
        {/* Product Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
            <img
              src={resolveProductImage(product.name, product.category, product.images)}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/categories/vegetables.jpg';
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Direct Agricultural Seller</span>
            </span>
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1 text-stone-400 hover:text-rose-600 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report Listing</span>
            </button>
          </div>
        </div>

        {/* Product Details & Actions */}
        <div className="flex flex-col space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {product.category}
              </span>
              {isOutOfStock ? (
                <Badge variant="red">Out of Stock</Badge>
              ) : product.availableQuantity <= 10 ? (
                <Badge variant="amber">Low Stock</Badge>
              ) : (
                <Badge variant="green">In Stock</Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 text-xs text-stone-500 mt-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {product.location?.villageOrTaluk ? `${product.location.villageOrTaluk}, ` : ''}
                {product.location?.district || 'Coimbatore'}, {product.location?.state || 'Tamil Nadu'}
              </span>
            </div>
          </div>

          {/* Unit Price and Available Unit Specification */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-baseline justify-between">
            <div>
              <div className="text-xs text-stone-500">Unit Price (INR)</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-800">
                {formatINR(product.price)}
                <span className="text-xs font-normal text-stone-500 ml-1">
                  / {product.priceUnit}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-stone-500">{t('availableStock')}</div>
              <div className="text-base font-bold text-stone-800">
                {product.availableQuantity} {product.quantityUnit}
              </div>
              {product.minOrderQuantity && product.minOrderQuantity > 1 && (
                <div className="text-[11px] text-amber-700">
                  Min. Order: {product.minOrderQuantity} {product.quantityUnit}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1">
              Produce & Harvesting Description
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Safety & Regulated Inputs Note */}
          {product.safetyInstructions && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>{t('safetyInstructions')}:</strong> {product.safetyInstructions}
              </div>
            </div>
          )}

          {/* Seller Card */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
            <div>
              <div className="text-stone-400 font-medium">Listed By</div>
              <div className="font-bold text-stone-800 text-sm">{product.sellerName}</div>
              <div className="text-emerald-700 capitalize font-medium">
                {product.sellerRole === 'farmer' ? 'Local Cultivator / Farmer' : 'Verified Agri Supplier'}
              </div>
            </div>
            {product.sellerPhone && (
              <a
                href={`tel:${product.sellerPhone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-semibold text-stone-700 hover:text-emerald-700 hover:border-emerald-300 transition-colors shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Contact Seller</span>
              </a>
            )}
          </div>

          {/* Quantity selector & Subtotal calculation */}
          {!isOutOfStock && (
            <div className="pt-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Select Purchase Quantity ({product.quantityUnit})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max((product.minOrderQuantity || 1), quantity - 1))}
                      className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 flex items-center justify-center text-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={product.minOrderQuantity || 1}
                      max={product.availableQuantity}
                      value={quantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val > product.availableQuantity) setQuantity(product.availableQuantity);
                        else setQuantity(Math.max(product.minOrderQuantity || 1, val));
                      }}
                      className="w-16 h-9 text-center font-bold text-stone-900 border border-stone-200 rounded-xl text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(product.availableQuantity, quantity + 1))}
                      className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                    <span className="text-xs text-stone-500 font-medium">
                      {product.quantityUnit}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-stone-500">Calculated Subtotal</div>
                  <div className="text-xl font-extrabold text-emerald-700">
                    {formatINR(currentSubtotal)}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="py-3 px-4 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{addedNotice ? 'Added to Cart ✓' : t('addToCart')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>{t('buyNow')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REPORT MODAL */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report Agricultural Listing"
      >
        {reportSubmitted ? (
          <div className="text-center py-6 space-y-2">
            <Check className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-stone-900">Thank you</h4>
            <p className="text-xs text-stone-500">Your complaint has been submitted for platform administrator review.</p>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Reason for report</label>
              <select
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="">Select reason...</option>
                <option value="Inaccurate Price or Measurement Unit">Inaccurate Price or Measurement Unit</option>
                <option value="Uncertified or Regulated Input Violation">Uncertified or Regulated Input Violation</option>
                <option value="Incorrect Stock Availability">Incorrect Stock Availability</option>
                <option value="Unreachable Seller / Fraud Suspicion">Unreachable Seller / Fraud Suspicion</option>
                <option value="Other Policy Violation">Other Policy Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Additional Details</label>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe any discrepancies or concerns..."
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors"
            >
              Submit Report
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

