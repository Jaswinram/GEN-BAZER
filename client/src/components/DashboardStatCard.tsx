import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

export interface DashboardStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  iconBg?: string;
  iconColor?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    period?: string;
    label?: string;
  };
  onClick?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconBg,
  iconColor = 'text-emerald-700',
  trend,
  onClick,
  onAction,
  actionLabel,
}) => {
  const effectiveBg = iconBg || iconBgColor || 'bg-emerald-50';
  const effectiveClick = onAction || onClick;

  const trendText =
    trend && typeof trend.value === 'number'
      ? `${trend.value > 0 && trend.isPositive !== false ? '+' : ''}${trend.value}%`
      : trend?.value;
  const trendSubtext = trend?.period || trend?.label;

  return (
    <div
      onClick={effectiveClick}
      className={`bg-white rounded-2xl border border-stone-200/90 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
        effectiveClick ? 'cursor-pointer hover:border-emerald-300' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-stone-500 block">{title}</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            {value}
          </div>
        </div>
        <div className={`w-11 h-11 rounded-2xl ${effectiveBg} ${iconColor} flex items-center justify-center shrink-0 shadow-2xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
          {trend ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold ${
                  trend.isPositive !== false
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-rose-50 text-rose-800'
                }`}
              >
                {trend.isPositive !== false ? (
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-rose-600" />
                )}
                <span>{trendText}</span>
              </span>
              {trendSubtext && <span className="text-stone-400">{trendSubtext}</span>}
            </div>
          ) : (
            <span className="text-stone-500">{subtitle}</span>
          )}

          {effectiveClick && (
            <span className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5">
              <span>{actionLabel || 'View'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          )}
        </div>
      )}
    </div>
  );
};
