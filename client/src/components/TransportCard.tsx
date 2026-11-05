import React from 'react';
import { MapPin, Weight, ArrowRight, ShieldCheck, Eye } from 'lucide-react';
import { TransportListing } from '../types';
import { formatINR } from '../utils/currency';
import { Badge } from './Badge';

interface TransportCardProps {
  transport: TransportListing;
  onRequest: (transport: TransportListing) => void;
  onViewDetails?: (transport: TransportListing) => void;
}

export const getVehicleCategoryLabel = (type: string) => {
  switch (type) {
    case 'bike':
      return 'Bike / Motorcycle (1–30 kg)';
    case 'moped_carrier':
      return 'Moped / TVS XL Carrier (10–60 kg)';
    case 'electric_scooter':
      return 'Electric Cargo Scooter (5–40 kg)';
    case 'auto_rickshaw':
      return 'Auto Rickshaw (30–150 kg)';
    case 'electric_auto':
      return 'Electric Cargo Auto (50–200 kg)';
    case 'mini_three_wheeler':
      return 'Mini Cargo Three-Wheeler (100–500 kg)';
    case 'mini_pickup':
      return 'Mini Pickup Truck (Tata Ace) (200+ kg)';
    case 'cargo_bike':
      return 'Delivery Bike (1–30 kg)';
    case 'mini_truck':
      return 'Tata Ace Mini Truck';
    case 'pickup':
      return 'Pickup Truck';
    case 'tractor_trolley':
      return 'Tractor Trolley';
    default:
      return type.replace('_', ' ');
  }
};

export const getVehicleImage = (type: string, images?: string[]) => {
  if (images && images.length > 0 && images[0]) return images[0];
  switch (type) {
    case 'bike':
    case 'cargo_bike':
      return '/vehicles/bike.jpg';
    case 'moped_carrier':
      return '/vehicles/moped_carrier.jpg';
    case 'electric_scooter':
      return '/vehicles/electric_scooter.jpg';
    case 'auto_rickshaw':
      return '/vehicles/auto_rickshaw.jpg';
    case 'electric_auto':
      return '/vehicles/electric_auto.jpg';
    case 'mini_three_wheeler':
      return '/vehicles/mini_three_wheeler.jpg';
    case 'mini_pickup':
    case 'mini_truck':
    case 'pickup':
      return '/vehicles/mini_pickup.jpg';
    default:
      return '/vehicles/bike.jpg';
  }
};

export const TransportCard: React.FC<TransportCardProps> = ({
  transport,
  onRequest,
  onViewDetails,
}) => {
  const formatPricing = () => {
    switch (transport.pricingModel) {
      case 'per_km':
        return `${formatINR(transport.baseRate)} / km`;
      case 'per_trip':
        return `${formatINR(transport.baseRate)} / trip`;
      case 'per_tonne':
        return `${formatINR(transport.baseRate)} / tonne`;
      case 'per_vehicle':
        return `${formatINR(transport.baseRate)} / vehicle`;
      case 'custom_quotation':
      default:
        return 'Custom Quotation';
    }
  };

  const capacityKg =
    transport.carryingCapacityKg ||
    (transport.carryingCapacityTonnes ? Math.round(transport.carryingCapacityTonnes * 1000) : 0);

  const displayName = transport.vehicleName || transport.vehicleNumber;

  const defaultImg = getVehicleImage(transport.vehicleType, transport.images);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden group">
      {/* Vehicle Image */}
      <div className="relative aspect-16/10 bg-stone-100 overflow-hidden">
        <img
          src={defaultImg}
          alt={displayName}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getVehicleImage(transport.vehicleType);
          }}
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
          <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
            {getVehicleCategoryLabel(transport.vehicleType)}
          </span>
          <Badge variant={transport.availabilityStatus === 'available' ? 'green' : 'gray'} size="sm">
            {transport.availabilityStatus}
          </Badge>
        </div>

        {transport.goodsPermitVerified !== false && (
          <div className="absolute bottom-2.5 right-2.5 bg-emerald-700/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <ShieldCheck className="w-3 h-3 text-emerald-200" />
            <span>Goods Permit Verified</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 p-5 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-1" title={displayName}>
              {displayName}
            </h3>
            <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md shrink-0">
              {transport.vehicleNumber}
            </span>
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            Provider: <span className="font-semibold text-stone-700">{transport.providerName}</span>
          </div>
        </div>

        {/* Verified Payload Badge */}
        <div className="p-2.5 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-900 text-xs">
            <Weight className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-stone-600">Verified Payload:</span>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md shadow-2xs border border-emerald-100">
            {capacityKg} kg
          </span>
        </div>

        {/* Location & Service Areas */}
        <div className="space-y-1 text-xs text-stone-600">
          <div className="flex items-center gap-1 text-stone-600">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium">
              Hub: {transport.pickupLocation.town ? `${transport.pickupLocation.town}, ` : ''}
              {transport.pickupLocation.district}
            </span>
          </div>
          <div className="text-[11px] text-stone-500 truncate">
            <span className="text-stone-400">Service Area: </span>
            {transport.serviceAreas.join(', ')}
          </div>
        </div>

        {/* Price & Action Buttons */}
        <div className="pt-3 mt-auto border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-stone-400 font-medium">
              {transport.pricingModel === 'per_km' ? 'Distance Rate' : transport.pricingModel === 'per_trip' ? 'Trip Rate' : 'Pricing'}
            </div>
            <div className="text-base font-extrabold text-emerald-700">
              {formatPricing()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewDetails ? (
              <button
                type="button"
                onClick={() => onViewDetails(transport)}
                className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                title="View full vehicle details & specs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onRequest(transport)}
              disabled={transport.availabilityStatus === 'offline'}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs shrink-0"
            >
              <span>Book Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
