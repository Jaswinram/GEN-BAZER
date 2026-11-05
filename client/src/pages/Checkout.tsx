import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, AlertCircle, CreditCard, Banknote, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatINR, calculateLineTotal } from '../utils/currency';
import { Modal } from '../components/Modal';

export const Checkout: React.FC = () => {
  const { items, subtotalAmount, deliveryCharges, totalAmount, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Delivery form state
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressLine, setAddressLine] = useState(user?.location?.address || '');
  const [district, setDistrict] = useState(user?.location?.district || 'Coimbatore');
  const [state, setState] = useState(user?.location?.state || 'Tamil Nadu');
  const [pincode, setPincode] = useState(user?.location?.pincode || '641014');

  const [paymentMethod, setPaymentMethod] = useState<'online_development' | 'cash_on_delivery'>('online_development');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Payment Simulation Modal State
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [paymentSession, setPaymentSession] = useState<any | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Please Sign In to Complete Order</h2>
        <p className="text-xs text-stone-500">
          You need an active farmer or buyer account to place orders on Gen Baazar.
        </p>
        <Link
          to="/login?redirect=/checkout"
          className="inline-block px-5 py-2.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !createdOrder) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Your cart is empty</h2>
        <Link
          to="/products"
          className="inline-block px-5 py-2.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl"
        >
          Browse Agricultural Marketplace
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOrder(true);
    setOrderError(null);

    try {
      // 1. Submit order to server (server will re-verify stock, unit prices, and compute totals)
      const res = await api.post('/orders', {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        deliveryAddress: {
          fullName,
          phone,
          addressLine,
          district,
          state,
          pincode,
        },
        paymentMethod,
      });

      if (res.data.success) {
        const order = res.data.order;
        setCreatedOrder(order);
        clearCart();

        if (paymentMethod === 'cash_on_delivery') {
          // COD order confirmed directly
          setPaymentSuccess(true);
        } else {
          // 2. Initiate Safe Development Payment session
          const payRes = await api.post('/payments/initiate', {
            orderId: order._id,
          });

          if (payRes.data.success) {
            setPaymentSession(payRes.data.payment);
            setPaymentModalOpen(true);
          }
        }
      }
    } catch (err: any) {
      setOrderError(err.response?.data?.message || 'Failed to place order. Please check stock availability.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleSimulatePayment = async (status: 'successful' | 'failed') => {
    if (!paymentSession) return;
    setProcessingPayment(true);

    try {
      const res = await api.post('/payments/verify', {
        paymentReference: paymentSession.paymentReference,
        status,
        simulatedTransactionId: `TXN-DEV-${Date.now()}`,
      });

      if (res.data.success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          setPaymentModalOpen(false);
        }, 2000);
      } else {
        alert('Payment verification failed as requested.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment processing error');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/cart"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-emerald-700"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Cart</span>
      </Link>

      <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Checkout & Order Placement</h1>

      {paymentSuccess ? (
        <div className="bg-white p-8 rounded-3xl border border-emerald-200 shadow-md text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900">Order Confirmed!</h2>
          <p className="text-xs text-stone-600">
            Your agricultural procurement order <strong className="text-emerald-700">{createdOrder?.orderReference}</strong> has been saved and forwarded to the farmers/suppliers.
          </p>

          <div className="p-4 bg-stone-50 rounded-2xl text-xs space-y-1.5 text-left">
            <div className="flex justify-between">
              <span className="text-stone-500">Order Reference:</span>
              <span className="font-bold text-stone-800">{createdOrder?.orderReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Total Paid:</span>
              <span className="font-bold text-emerald-800">{formatINR(createdOrder?.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Payment Status:</span>
              <span className="font-bold text-emerald-700 uppercase">{createdOrder?.paymentStatus || 'successful'}</span>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Link
              to="/dashboard/buyer"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Track Order in Dashboard
            </Link>
            <Link
              to="/products"
              className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping & Payment Options Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Details */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-stone-900">1. Delivery / Mandi Destination Address</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Recipient / Business Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Anand Kumar (Traders)"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Contact Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98840 00000"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-semibold mb-1">Street Address / Mandi Stall</label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="e.g. Stall 14, Wholesale Block B, Koyambedu Vegetable Market"
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-stone-900">2. Payment Method (Indian Rupees ₹ / INR)</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'online_development'
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online_development"
                    checked={paymentMethod === 'online_development'}
                    onChange={() => setPaymentMethod('online_development')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-stone-900 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span>Online Test Gateway (UPI / NetBanking)</span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      Safe Development Mode. Simulates instant payment verification with order reference.
                    </div>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={() => setPaymentMethod('cash_on_delivery')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-stone-900 flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-700" />
                      <span>Cash on Delivery / Mandi Pay</span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      Pay cash to the farmer / transporter upon produce delivery.
                    </div>
                  </div>
                </label>
              </div>

              {orderError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items & Total Overview */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs h-fit space-y-4">
            <h2 className="text-base font-bold text-stone-900">Procurement Summary</h2>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-xs divide-y divide-stone-100">
              {items.map((i) => (
                <div key={i.productId} className="pt-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-stone-800 line-clamp-1">{i.name}</div>
                    <div className="text-[11px] text-stone-500">
                      {i.quantity} {i.quantityUnit} × {formatINR(i.price)}
                    </div>
                  </div>
                  <div className="font-bold text-stone-900">
                    {formatINR(calculateLineTotal(i.price, i.quantity))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900">{formatINR(subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Transit / Delivery</span>
                <span className="font-semibold text-stone-900">{deliveryCharges === 0 ? 'FREE' : formatINR(deliveryCharges)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Tax (GST)</span>
                <span className="font-semibold text-stone-900">₹0.00</span>
              </div>
              <div className="flex items-baseline justify-between pt-2 border-t border-stone-100 text-base font-bold text-stone-900">
                <span>Total Payable (INR)</span>
                <span className="text-xl font-black text-emerald-800">{formatINR(totalAmount)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingOrder}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {submittingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating Stock & Placing Order...</span>
                </>
              ) : (
                <span>Confirm & Place Order ({formatINR(totalAmount)})</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* SAFE DEVELOPMENT MODE PAYMENT MODAL */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Gen Baazar Safe Test Payment Gateway"
      >
        <div className="space-y-4 text-xs">
          {/* Transparency alert */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
            <strong>Safe Development Mode Notice:</strong> This payment modal simulates an Indian digital payment transaction (UPI, RuPay, NetBanking) without connecting to real bank accounts or charging real money.
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex justify-between text-stone-600">
              <span>Order Reference:</span>
              <span className="font-mono font-bold text-stone-800">{paymentSession?.orderReference}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Payment Session ID:</span>
              <span className="font-mono text-stone-500 text-[11px] truncate max-w-[200px]">{paymentSession?.paymentReference}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Currency:</span>
              <span className="font-bold text-stone-800">Indian Rupees (INR)</span>
            </div>
            <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
              <span>Amount Due:</span>
              <span className="text-emerald-700 text-lg font-black">{paymentSession?.formattedAmount}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-stone-500 font-semibold">Simulate Payment Resolution:</div>
            <button
              type="button"
              onClick={() => handleSimulatePayment('successful')}
              disabled={processingPayment}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {processingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Simulate Successful Payment (Authorize ₹)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulatePayment('failed')}
              disabled={processingPayment}
              className="w-full py-2 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 font-semibold rounded-xl transition-colors"
            >
              Simulate Declined / Failed Transaction
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

