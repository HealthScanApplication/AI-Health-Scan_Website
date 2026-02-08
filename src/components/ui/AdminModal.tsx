"use client";

/**
 * AdminModal — Tailwind UI Dialog pattern
 * Uses portal-free fixed overlay + centered panel.
 * Based on https://tailwindui.com/components/application-ui/overlays/dialogs
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

const sizeClasses: Record<string, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
};

export function AdminModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
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
    /* Tailwind UI: fixed full-screen container */
    <div className="relative z-50" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500/75 transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Centering wrapper */}
      <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          {/* Panel */}
          <div
            className={`relative w-full ${sizeClasses[size] || 'sm:max-w-lg'} transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
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

            {/* Body */}
            <div
              className={`max-h-[calc(80vh-8rem)] overflow-y-auto ${noPadding ? '' : 'px-6 py-5'}`}
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
