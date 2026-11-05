import React from 'react';
import { MapPin, Wrench, Calendar, Gauge, Eye, ArrowRight, ShieldCheck } from 'lucide-react';
import { MachineryListing } from '../types';
import { formatINR } from '../utils/currency';
import { Badge } from './Badge';

interface MachineryCardProps {
  machinery: MachineryListing;
  onBook: (machinery: MachineryListing) => void;
  onViewDetails?: (machinery: MachineryListing) => void;
}

export const getMachineryTypeLabel = (type: string) => {
  switch (type) {
    case 'tractor':
      return 'Tractor';
    case 'rotavator':
      return 'Rotavator';
    case 'cultivator':
      return 'Cultivator';
    case 'power_tiller':
      return 'Power Tiller';
    case 'combine_harvester':
    case 'harvester':
      return 'Combine Harvester';
    case 'paddy_transplanter':
      return 'Paddy Transplanter';
    case 'seed_drill':
      return 'Seed Drill';
    case 'sprayer':
      return 'Agricultural Sprayer';
    case 'thresher':
      return 'Thresher';
    case 'water_pump':
      return 'Water Pump Set';
    case 'tractor_trailer':
      return 'Tractor Trailer';
    case 'brush_cutter':
      return 'Brush Cutter';
    case 'ploughing_equipment':
      return 'Ploughing Rig';
    default:
      return type.replace('_', ' ');
  }
};

export const getMachineryImage = (type: string, images?: string[]) => {
  if (images && images.length > 0 && images[0]) return images[0];
  switch (type) {
    case 'tractor':
      return '/machinery/tractor.jpg';
    case 'rotavator':
      return '/machinery/rotavator.jpg';
    case 'cultivator':
      return '/machinery/cultivator.jpg';
    case 'power_tiller':
      return '/machinery/power_tiller.jpg';
    case 'combine_harvester':
    case 'harvester':
      return '/machinery/combine_harvester.jpg';
    case 'paddy_transplanter':
      return '/machinery/paddy_transplanter.jpg';
    case 'seed_drill':
      return '/machinery/seed_drill.jpg';
    case 'sprayer':
      return '/machinery/sprayer.jpg';
    case 'thresher':
      return '/machinery/thresher.jpg';
    case 'water_pump':
      return '/machinery/water_pump.jpg';
    case 'tractor_trailer':
      return '/machinery/tractor_trailer.jpg';
    case 'brush_cutter':
      return '/machinery/brush_cutter.jpg';
    default:
      return '/machinery/tractor.jpg';
  }
};

export const MachineryCard: React.FC<MachineryCardProps> = ({
  machinery,
  onBook,
  onViewDetails,
}) => {
  const isAvailable = machinery.availabilityStatus === 'available';
  const imgUrl = getMachineryImage(machinery.machineryType, machinery.images);

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden group">
      {/* Photograph */}
      <div className="relative aspect-16/10 bg-stone-100 overflow-hidden">
        <img
          src={imgUrl}
          alt={machinery.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getMachineryImage(machinery.machineryType);
          }}
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
          <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize">
            {getMachineryTypeLabel(machinery.machineryType)}
          </span>
          <Badge variant={isAvailable ? 'green' : 'amber'} size="sm">
            {isAvailable ? 'Available for Rent' : machinery.availabilityStatus}
          </Badge>
        </div>

        <div className="absolute bottom-2.5 right-2.5 bg-emerald-800/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
          <ShieldCheck className="w-3 h-3 text-emerald-200" />
          <span>Operator Verified</span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5 space-y-3">
        <div>
          <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-1" title={machinery.title}>
            {machinery.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium">
              {machinery.location.town ? `${machinery.location.town}, ` : ''}
              {machinery.location.district}, {machinery.location.state}
            </span>
          </div>
        </div>

        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
          {machinery.description}
        </p>

        {/* Specifications highlights */}
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-stone-50 rounded-xl text-xs text-stone-700 border border-stone-100">
          <div className="flex items-center gap-1.5 truncate">
            <Gauge className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Power: <strong>{machinery.specifications?.horsepower || 'Standard'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Wrench className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Fuel: <strong>{machinery.specifications?.fuelType || 'Diesel'}</strong></span>
          </div>
        </div>

        {/* Price and Buttons */}
        <div className="pt-3 mt-auto border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-stone-400 font-medium">Rental Tariff</div>
            <div className="text-base font-extrabold text-emerald-700 flex items-baseline gap-1">
              <span>{formatINR(machinery.rentalPrice)}</span>
              <span className="text-xs font-normal text-stone-500">
                / {machinery.rentalUnit}
              </span>
            </div>
            <div className="text-[11px] text-stone-500">
              Provider: <strong className="text-stone-700">{machinery.ownerName}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewDetails && (
              <button
                type="button"
                onClick={() => onViewDetails(machinery)}
                className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                title="View full specifications & operator rules"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onBook(machinery)}
              disabled={!isAvailable}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs shrink-0 ${
                isAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
