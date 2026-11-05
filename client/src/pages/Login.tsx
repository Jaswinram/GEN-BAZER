import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sprout, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        if (redirect && redirect !== '/') {
          navigate(redirect);
        } else if (res.data.user.role === 'admin') {
          navigate('/dashboard/admin');
        } else if (res.data.user.role === 'farmer') {
          navigate('/dashboard/farmer');
        } else if (res.data.user.role === 'buyer') {
          navigate('/dashboard/buyer');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-sm">
          <Sprout className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Sign in to Gen Baazar</h1>
        <p className="text-xs text-stone-500">
          Access your agricultural listings, orders, machinery bookings, and freight requests.
        </p>
      </div>

      {/* Standard Credentials Form */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. farmer@genbaazar.com"
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            <span>Sign In</span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-stone-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-emerald-700 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

