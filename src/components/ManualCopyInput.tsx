"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from '../utils/copyUtils';

interface ManualCopyInputProps {
  value: string;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function ManualCopyInput({ 
  value, 
  label = "Copy this text", 
  placeholder = "Select and copy this text",
  className = ""
}: ManualCopyInputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(value, {
      successMessage: '✅ Copied to clipboard!',
      errorMessage: 'Please copy manually from the input field',
      showManualCopy: true
    });

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <Input
          value={value}
          readOnly
          placeholder={placeholder}
          className="flex-1 cursor-text select-all"
          onClick={(e) => {
            const input = e.target as HTMLInputElement;
            input.select();
          }}
        />
        <Button
          onClick={handleCopy}
          size="sm"
          variant="outline"
          className={`px-3 transition-colors ${
            copied 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'hover:bg-gray-50'
          }`}
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Click the input to select all text, then copy with Ctrl+C (or Cmd+C)
      </p>
    </div>
  );
}