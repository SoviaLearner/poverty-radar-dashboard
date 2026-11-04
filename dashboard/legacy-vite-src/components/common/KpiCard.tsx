import React from 'react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  benchmarkText: string;
  contextText?: string;
  badge?: {
    text: string;
    type?: 'default' | 'critical' | 'positive' | 'warning' | 'filter';
  };
  accentColor?: string;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  benchmarkText,
  contextText,
  badge,
  accentColor,
  onClick,
  className = '',
  isActive = false,
}) => {
  const getBadgeStyle = () => {
    switch (badge?.type) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200/90';
      case 'positive':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/90';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200/90';
      case 'filter':
        return 'bg-blue-50 text-okabe-blue border-blue-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const fullTooltip = `${label}: ${value} ${unit || ''} | ${benchmarkText}${contextText ? ' · ' + contextText : ''}`;

  return (
    <article
      onClick={onClick}
      title={fullTooltip}
      className={`bg-surface rounded-xl p-2.5 sm:py-2 sm:px-3 shadow-2xs transition-all flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:shadow-subtle hover:-translate-y-0.5' : 'hover:shadow-subtle'
      } ${
        isActive 
          ? 'border-2 border-okabe-blue ring-2 ring-okabe-blue/20 bg-blue-50/20' 
          : 'border border-slate-200/90'
      } ${className}`}
      role={onClick ? "button" : "region"}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      aria-label={`${label}: ${value} ${unit || ''}`}
    >
      <dl className="flex flex-col justify-between h-full space-y-1 m-0">
        {/* Tier 1: Label + Badge */}
        <div className="flex items-start justify-between gap-1.5">
          <dt className="text-[10px] sm:text-[10.5px] font-bold tracking-wider uppercase text-slate-600 leading-tight">
            {label}
          </dt>
          {badge && (
            <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border shrink-0 leading-none whitespace-nowrap mt-0.5 ${getBadgeStyle()}`}>
              {badge.text}
            </span>
          )}
        </div>

        {/* Tier 2: Big Number + Unit */}
        <dd className="m-0 flex items-baseline space-x-1.5">
          <span
            className="text-xl sm:text-[22px] font-black tracking-tight tabular-nums font-mono leading-none"
            style={{ color: accentColor || '#0F172A' }}
          >
            {value}
          </span>
          {unit && (
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
              {unit}
            </span>
          )}
        </dd>

        {/* Tier 3: Benchmark & Context (Wrap text cleanly without truncation) */}
        <dd className="m-0 pt-1 border-t border-slate-100 text-[10.5px] text-slate-500 space-y-0.5">
          <p 
            className="text-[10.5px] font-medium text-slate-600 leading-snug break-words" 
            title={benchmarkText}
          >
            {benchmarkText}
          </p>
          {contextText && (
            <p 
              className="text-[9.5px] text-slate-500 leading-snug break-words" 
              title={contextText}
            >
              {contextText}
            </p>
          )}
        </dd>
      </dl>
    </article>
  );
};
