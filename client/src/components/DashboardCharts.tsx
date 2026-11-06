import React from 'react';
import { formatINR } from '../utils/currency';

export interface BarDataPoint {
  label: string;
  value: number;
  formatted?: string;
  isHighlight?: boolean;
}

export interface RevenueBarChartProps {
  title: string;
  subtitle?: string;
  data: BarDataPoint[];
  currencySymbol?: string;
  unit?: string;
  height?: number;
}

export const RevenueBarChart: React.FC<RevenueBarChartProps> = ({
  title,
  subtitle,
  data,
  currencySymbol,
  unit,
}) => {
  const symbol = unit || currencySymbol || '₹';
  const maxValue = Math.max(...data.map((d) => d.value), 100);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-stone-900 text-sm sm:text-base">{title}</h3>
          {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-stone-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Volume ({symbol})</span>
          </span>
        </div>
      </div>

      {/* Responsive Bar Container */}
      <div className="h-48 pt-6 pb-2 flex items-end justify-between gap-2 sm:gap-3">
        {data.map((item, idx) => {
          const heightPercent = Math.max(8, Math.round((item.value / maxValue) * 100));
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
              {/* Tooltip on Hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-stone-900 text-white px-2 py-0.5 rounded-md shadow-xs pointer-events-none whitespace-nowrap mb-1">
                {item.formatted || `${symbol}${item.value.toLocaleString('en-IN')}`}
              </div>

              {/* Bar Column */}
              <div className="w-full max-w-[40px] bg-stone-100 rounded-xl h-full flex items-end p-1 overflow-hidden">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-lg transition-all duration-500 ${
                    item.isHighlight
                      ? 'bg-gradient-to-t from-emerald-700 to-emerald-500 shadow-xs'
                      : 'bg-emerald-600/80 group-hover:bg-emerald-600'
                  }`}
                />
              </div>

              {/* X-axis Label */}
              <span className="text-[10px] font-semibold text-stone-500 group-hover:text-stone-900 transition-colors truncate max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface DistributionItem {
  label?: string;
  name?: string;
  count?: number;
  value?: number;
  color: string;
  percentage?: number;
}

export interface DistributionCardProps {
  title: string;
  subtitle?: string;
  items: DistributionItem[];
  totalCount?: number;
  totalLabel?: string;
}

export const DistributionCard: React.FC<DistributionCardProps> = ({
  title,
  subtitle,
  items,
  totalCount,
  totalLabel,
}) => {
  const normalizedItems = items.map((i) => ({
    label: i.label || i.name || 'Other',
    count: i.count !== undefined ? i.count : i.value !== undefined ? i.value : 0,
    color: i.color,
    percentage: i.percentage,
  }));

  const total = totalCount !== undefined ? totalCount : (normalizedItems.reduce((sum, item) => sum + item.count, 0) || 1);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-2xs space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-stone-900 text-sm sm:text-base">{title}</h3>
          {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
        </div>
        {totalLabel && (
          <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
            {total} {totalLabel}
          </span>
        )}
      </div>

      {/* Progress Split Bar */}
      <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
        {normalizedItems.map((item, idx) => {
          const pct = item.percentage !== undefined ? item.percentage : Math.round((item.count / total) * 100);
          if (pct === 0) return null;
          return (
            <div
              key={idx}
              style={{ width: `${pct}%` }}
              className={`h-full ${item.color} transition-all duration-300`}
              title={`${item.label}: ${item.count} (${pct}%)`}
            />
          );
        })}
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
        {normalizedItems.map((item, idx) => {
          return (
            <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-100">
              <div className="flex items-center gap-2 truncate pr-1">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                <span className="font-medium text-stone-700 truncate">{item.label}</span>
              </div>
              <span className="font-extrabold text-stone-900 shrink-0">{item.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
