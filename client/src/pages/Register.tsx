import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sprout, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = (searchParams.get('role') as UserRole) || 'buyer';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [farmOrBusinessName, setFarmOrBusinessName] = useState('');
  const [district, setDistrict] = useState('Coimbatore');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('641001');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        phone,
        role,
        farmOrBusinessName,
        location: {
          state: 'Tamil Nadu',
          district,
          address,
          pincode,
        },
      });

      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-sm">
          <Sprout className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Create Gen Baazar Account</h1>
        <p className="text-xs text-stone-500">
          Join the agricultural marketplace connecting farmers, buyers, machinery providers & transport logistics.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Role selector */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1.5">I am registering as:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'farmer', label: 'Farmer / Cultivator' },
                { id: 'buyer', label: 'Merchant / Buyer' },
                { id: 'supplier', label: 'Agri Supplier' },
                { id: 'machinery_owner', label: 'Machinery Owner' },
                { id: 'transport_provider', label: 'Transport Provider' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id as UserRole)}
                  className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                    role === r.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Murugan Selvam"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Phone Number (+91)</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98421 00000"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-stone-700 font-semibold mb-1">Farm / Business Name (Optional)</label>
              <input
                type="text"
                value={farmOrBusinessName}
                onChange={(e) => setFarmOrBusinessName(e.target.value)}
                placeholder="e.g. Sri Murugan Agro Farms"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="Coimbatore">Coimbatore</option>
                <option value="Tiruppur">Tiruppur</option>
                <option value="Erode">Erode</option>
                <option value="Salem">Salem</option>
                <option value="Thanjavur">Thanjavur</option>
                <option value="Madurai">Madurai</option>
                <option value="Chennai">Chennai</option>
              </select>
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

            <div className="sm:col-span-2">
              <label className="block text-stone-700 font-semibold mb-1">Village / Street Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Thondamuthur Village, Pollachi Main Road"
                className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>Create {role.replace('_', ' ')} Account</span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-stone-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-emerald-700 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

