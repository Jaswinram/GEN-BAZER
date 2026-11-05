import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-stone-900 text-stone-300 mt-20 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Gen Baazar
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Empowering farmers, wholesale merchants, agri-suppliers, machinery owners, and transport operators across India with transparent INR-based trading and mechanization.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-800 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Indian Rupees (₹ / INR) Secure Trade</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Marketplace
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products?category=Vegetables" className="hover:text-emerald-400 transition-colors">
                  Fresh Vegetables
                </Link>
              </li>
              <li>
                <Link to="/products?category=Grains%20%26%20Pulses" className="hover:text-emerald-400 transition-colors">
                  Grains, Rice & Pulses
                </Link>
              </li>
              <li>
                <Link to="/products?category=Seeds" className="hover:text-emerald-400 transition-colors">
                  Certified Seeds
                </Link>
              </li>
              <li>
                <Link to="/machinery" className="hover:text-emerald-400 transition-colors">
                  Tractors & Harvesters
                </Link>
              </li>
              <li>
                <Link to="/transport" className="hover:text-emerald-400 transition-colors">
                  Agri Freight & Logistics
                </Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem Roles */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              User Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/register?role=farmer" className="hover:text-emerald-400 transition-colors">
                  Farmer Registration
                </Link>
              </li>
              <li>
                <Link to="/register?role=buyer" className="hover:text-emerald-400 transition-colors">
                  Wholesale Buyer Portal
                </Link>
              </li>
              <li>
                <Link to="/register?role=supplier" className="hover:text-emerald-400 transition-colors">
                  Agri Input Supplier
                </Link>
              </li>
              <li>
                <Link to="/register?role=machinery_owner" className="hover:text-emerald-400 transition-colors">
                  Machinery Rental Fleet
                </Link>
              </li>
              <li>
                <Link to="/register?role=transport_provider" className="hover:text-emerald-400 transition-colors">
                  Transport Partner
                </Link>
              </li>
              <li>
                <Link to="/market-prices" className="hover:text-emerald-400 transition-colors">
                  Live APMC Mandi Rates
                </Link>
              </li>
            </ul>
          </div>

          {/* Regional Support */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Kisan Desk
            </h4>
            <div className="space-y-2.5 text-xs text-stone-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Agricultural Hub, Pollachi Main Road, Coimbatore, Tamil Nadu - 641014</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+91 98421 00000 / 1800-AGRI-BAAZAR</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@genbaazar.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} Gen Baazar Agricultural Marketplace. {t('footerRights')}</p>
          <div className="flex items-center gap-1 text-stone-400">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
            <span>for Indian Farmers & Agri-Entrepreneurs</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

