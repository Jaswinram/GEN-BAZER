import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Sprout, ShoppingCart, Eye, ShieldCheck, Scale } from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils/currency';
import { Badge } from './Badge';
import { resolveProductImage } from '../utils/productImages';

interface ProductCardProps {
  product: Product;
  onBuyNow?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onBuyNow,
  onViewDetails,
}) => {
  const isAvailable = product.stockStatus === 'in_stock' && product.availableQuantity > 0;
  const isLowStock = product.stockStatus === 'low_stock' || (product.availableQuantity > 0 && product.availableQuantity <= 10);
  const imgUrl = resolveProductImage(product.name, product.category, product.images);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden group">
      {/* Photograph */}
      <div className="relative aspect-16/10 bg-stone-100 overflow-hidden">
        <img
          src={imgUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/categories/vegetables.jpg';
          }}
        />

        {/* Top-left Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
          <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize">
            {product.category}
          </span>
          <Badge variant={isAvailable ? (isLowStock ? 'amber' : 'green') : 'red'} size="sm">
            {!isAvailable ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
          </Badge>
        </div>

        {/* Bottom-right verified badge */}
        <div className="absolute bottom-2.5 right-2.5 bg-emerald-800/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
          <ShieldCheck className="w-3 h-3 text-emerald-200" />
          <span>Farm Verified</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-5 space-y-3">
        <div>
          <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-1" title={product.name}>
            {product.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium">
              {product.location?.villageOrTaluk ? `${product.location.villageOrTaluk}, ` : ''}
              {product.location?.district || 'Coimbatore'}, {product.location?.state || 'TN'}
            </span>
          </div>
        </div>

        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Specifications / Stock highlights */}
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-stone-50 rounded-xl text-xs text-stone-700 border border-stone-100">
          <div className="flex items-center gap-1.5 truncate">
            <Scale className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Stock: <strong>{product.availableQuantity} {product.quantityUnit}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Min Order: <strong>{product.minOrderQuantity || 1} {product.quantityUnit}</strong>
            </span>
          </div>
        </div>

        {/* Price and Action Buttons */}
        <div className="pt-3 mt-auto border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-stone-400 font-medium">Mandi Tariff</div>
            <div className="text-base font-extrabold text-emerald-700 flex items-baseline gap-1">
              <span>{formatINR(product.price)}</span>
              <span className="text-xs font-normal text-stone-500">
                / {product.priceUnit}
              </span>
            </div>
            <div className="text-[11px] text-stone-500 truncate max-w-[130px]">
              Seller: <strong className="text-stone-700">{product.sellerName}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewDetails ? (
              <button
                type="button"
                onClick={() => onViewDetails(product)}
                className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                title="View full crop details & seller verification"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>
            ) : (
              <Link
                to={`/products/${product._id}`}
                className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => onBuyNow && onBuyNow(product)}
              disabled={!isAvailable}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs shrink-0 ${
                isAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
