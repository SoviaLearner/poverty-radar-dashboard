import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

interface NarrativeCalloutProps {
  title?: string;
  insight: string;
  evidence?: string;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export const NarrativeCallout: React.FC<NarrativeCalloutProps> = ({
  title = "TEMUAN & WAWASAN KEBIJAKAN",
  insight,
  evidence,
  className = "",
  collapsible = true,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  return (
    <aside 
      className={`bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 sm:p-4 text-ink-primary shadow-2xs transition-all ${className}`}
      aria-expanded={collapsible ? isExpanded : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center space-x-1.5">
              <span>{title}</span>
            </div>
            
            {(!collapsible || isExpanded) ? (
              <>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal pt-0.5">
                  {insight}
                </p>
                {evidence && (
                  <p className="text-xs text-amber-950/90 font-medium italic pt-1 border-t border-amber-200/60 mt-1.5">
                    Bukti empiris: {evidence}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-600 truncate font-normal">
                {insight}
              </p>
            )}
          </div>
        </div>

        {collapsible && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-amber-800 hover:text-amber-950 hover:bg-amber-100/80 rounded-md transition-colors shrink-0"
            title={isExpanded ? "Ciutkan wawasan narasi" : "Bentangkan wawasan narasi lengkap"}
            aria-label={isExpanded ? "Ciutkan narasi" : "Bentangkan narasi"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
    </aside>
  );
};
