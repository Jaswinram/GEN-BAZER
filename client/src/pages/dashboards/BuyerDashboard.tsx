import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, CheckCircle2, Truck, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { Order } from '../../types';
import { formatINR } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';

export const BuyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my');
        if (res.data.success) {
          setOrders(res.data.orders);
        }
      } catch (err) {
        console.error('Failed to load buyer orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const totalSpentINR = orders
    .filter((o) => o.paymentStatus === 'successful' || o.orderStatus === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingDeliveries = orders.filter((o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 uppercase">
          Wholesale Buyer Dashboard
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
          Welcome, {user?.name}
        </h1>
        <p className="text-xs text-stone-500">
          {user?.farmOrBusinessName || 'Commercial Buyer'} • {user?.location.district}, {user?.location.state}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Total Orders Placed</div>
          <div className="text-2xl font-black text-stone-900 mt-1">{orders.length}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Pending Deliveries</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingDeliveries}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Completed Procurements</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {orders.filter((o) => o.orderStatus === 'delivered').length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Total Spent (INR)</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{formatINR(totalSpentINR)}</div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">Recent Procurement Orders</h2>
          <Link
            to="/products"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Procure More Harvest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-xs space-y-3">
            <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
            <p>You have not placed any agricultural procurement orders yet.</p>
            <Link
              to="/products"
              className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-xs"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="p-5 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
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

                  {/* Items snapshot */}
                  <div className="text-xs text-stone-700 space-y-0.5">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{it.name}</span>
                        <span className="text-stone-400">•</span>
                        <span>{it.quantity} {it.quantityUnit} × {formatINR(it.price)} / {it.priceUnit}</span>
                        <span className="text-stone-400">•</span>
                        <span className="font-semibold text-emerald-800">{formatINR(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-stone-400">
                    Delivery to: {order.deliveryAddress.addressLine}, {order.deliveryAddress.district}
                  </div>
                </div>

                <div className="text-right w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-stone-200">
                  <div className="text-xs text-stone-500">Total Amount Paid</div>
                  <div className="text-xl font-black text-emerald-800">
                    {formatINR(order.totalAmount)}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

