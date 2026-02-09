"use client";

/**
 * AdminModal — Tailwind UI Dialog pattern
 * Desktop : 50 vw wide, 50 vh tall, dead-centre
 * Mobile  : full-width, full-height
 */

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  noPadding?: boolean;
  className?: string;
}

export function AdminModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size: _size,
  noPadding = false,
  className = '',
}: AdminModalProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, handleEsc]);

  if (!open) return null;

  return (
    <div className="relative z-50" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500/75 transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Centering wrapper — always dead-centre */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Panel
            Mobile  : full width/height (minus padding)
            Desktop : 50 vw × 50 vh, centred */}
        <div
          className={`
            relative flex flex-col
            w-full h-full
            sm:w-[50vw] sm:max-w-[720px] sm:min-w-[480px] sm:h-[80vh] sm:min-h-[500px]
            overflow-hidden rounded-xl bg-white text-left shadow-xl
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || subtitle) && (
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 shrink-0">
              <div className="min-w-0">
                {title && (
                  <h3 className="text-base font-semibold leading-6 text-gray-900 truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500 truncate">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Body — fills remaining space, scrolls */}
          <div
            className={`flex-1 min-h-0 overflow-y-auto ${noPadding ? '' : 'px-6 py-5'}`}
          >
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
