"use client";

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  /** Total item count to display as a badge (optional) */
  itemCount?: number;
  /** Number of items to show before collapsing. Default: 4 */
  previewCount?: number;
  /** Whether the section starts expanded. Default: false */
  defaultExpanded?: boolean;
  /** Custom class for the outer container */
  className?: string;
  /** Render function that receives (expanded: boolean) so parent can slice items */
  children: ReactNode | ((expanded: boolean) => ReactNode);
  /** Total number of items (used to decide if "View All" is needed). If not set, always shows toggle. */
  totalItems?: number;
  /** Custom label for the expand button. Default: "View All" */
  expandLabel?: string;
  /** Custom label for the collapse button. Default: "Show Less" */
  collapseLabel?: string;
}

export function CollapsibleSection({
  title,
  itemCount,
  previewCount = 4,
  defaultExpanded = false,
  className = '',
  children,
  totalItems,
  expandLabel = 'View All',
  collapseLabel = 'Show Less',
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const needsToggle = totalItems != null ? totalItems > previewCount : true;

  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-800">{title}</span>
          {itemCount != null && itemCount > 0 && (
            <span className="bg-gray-200 text-gray-600 text-[10px] font-bold rounded-full px-1.5 py-0.5">
              {itemCount}
            </span>
          )}
        </div>
        {needsToggle && (
          <button
            type="button"
            onClick={() => setExpanded(prev => !prev)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5 transition-colors"
          >
            {expanded ? collapseLabel : expandLabel}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {typeof children === 'function' ? children(expanded) : children}
      </div>
    </div>
  );
}
