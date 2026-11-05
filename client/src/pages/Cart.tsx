import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatINR, calculateLineTotal } from '../utils/currency';

export const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, subtotalAmount, deliveryCharges, totalAmount } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900">{t('emptyCart')}</h2>
        <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">{t('emptyCartPrompt')}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
        >
          <span>Explore Fresh Produce</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Shopping Cart</h1>
          <p className="text-xs text-stone-500">
            {items.length} {items.length === 1 ? 'agricultural item' : 'agricultural items'} ready for procurement
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-stone-400 hover:text-rose-600 transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const lineTotal = calculateLineTotal(item.price, item.quantity);
            return (
              <div
                key={item.productId}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Item Thumbnail and Info */}
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                    <img
                      src={item.image || '/categories/vegetables.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/categories/vegetables.jpg';
                      }}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-stone-900 text-sm line-clamp-1">
                      {item.name}
                    </h3>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Seller: <span className="font-medium text-stone-700">{item.sellerName}</span>
                    </div>
                    <div className="text-xs font-bold text-emerald-700 mt-1">
                      {formatINR(item.price)} <span className="font-normal text-stone-400">/ {item.priceUnit}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity and Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  {/* Quantity Controller */}
                  <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white text-stone-700 hover:bg-stone-200 font-bold flex items-center justify-center text-xs shadow-2xs"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-xs text-stone-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white text-stone-700 hover:bg-stone-200 font-bold flex items-center justify-center text-xs shadow-2xs"
                    >
                      +
                    </button>
                    <span className="text-[11px] text-stone-500 pr-1">{item.quantityUnit}</span>
                  </div>

                  {/* Line Total */}
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-stone-900">
                      {formatINR(lineTotal)}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      ({item.quantity} × {formatINR(item.price)})
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 pt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Procurement</span>
          </Link>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs h-fit space-y-5">
          <h2 className="text-base font-bold text-stone-900">Order Summary</h2>

          <div className="space-y-3 text-xs border-b border-stone-100 pb-4">
            <div className="flex items-center justify-between text-stone-600">
              <span>{t('subtotal')}</span>
              <span className="font-semibold text-stone-900">{formatINR(subtotalAmount)}</span>
            </div>

            <div className="flex items-center justify-between text-stone-600">
              <span>{t('deliveryCharges')}</span>
              <span className="font-semibold text-stone-900">
                {deliveryCharges === 0 ? (
                  <span className="text-emerald-600 font-bold">FREE (Orders &gt; ₹1,000)</span>
                ) : (
                  formatINR(deliveryCharges)
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-stone-600">
              <span>Estimated Tax (GST Exempt Agri Produce)</span>
              <span className="font-semibold text-stone-900">₹0.00</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between text-base">
            <span className="font-bold text-stone-900">{t('total')} (INR)</span>
            <span className="text-2xl font-black text-emerald-800">{formatINR(totalAmount)}</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Server validates product stock and real-time prices at checkout.</span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <span>{t('checkout')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

