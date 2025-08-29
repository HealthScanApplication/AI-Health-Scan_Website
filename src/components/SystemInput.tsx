import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../components/ui/utils';
import { useDesignSystem } from '../contexts/DesignSystemContext';

const inputVariants = cva(
  "flex w-full border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-[var(--text-size-standard-density)] font-normal file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-[var(--duration-normal)]",
  {
    variants: {
      variant: {
        default: "rounded-[var(--radius-lg)] focus:border-[var(--primary)]",
        outline: "border-2 rounded-[var(--radius-lg)] focus:border-[var(--primary)]",
        filled: "bg-[var(--muted)] border-transparent focus:border-[var(--primary)] focus:bg-[var(--background)]",
        underline: "border-0 border-b-2 border-[var(--border)] rounded-none focus:border-[var(--primary)] bg-transparent",
        brand: "border-[var(--healthscan-green)]/30 focus:border-[var(--healthscan-green)] focus:ring-[var(--healthscan-green)]",
      },
      size: {
        sm: "h-[var(--input-height-sm)] px-2 text-sm",
        default: "h-[var(--input-height-standard)] px-3",
        lg: "h-[var(--input-height-lg)] px-4 text-lg",
      },
      state: {
        default: "",
        error: "border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive)]",
        success: "border-[var(--success)] focus:border-[var(--success)] focus:ring-[var(--success)]",
        warning: "border-[var(--warning)] focus:border-[var(--warning)] focus:ring-[var(--warning)]",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
);

export interface SystemInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

const SystemInput = forwardRef<HTMLInputElement, SystemInputProps>(
  ({ 
    className, 
    variant, 
    size, 
    state, 
    label,
    helperText,
    errorText,
    leftIcon,
    rightIcon,
    leftAddon,
    rightAddon,
    id,
    ...props 
  }, ref) => {
    const { theme } = useDesignSystem();
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!errorText;
    const finalState = hasError ? 'error' : state;
    
    const InputComponent = (
      <div className="relative flex items-center">
        {leftAddon && (
          <div className="flex items-center px-3 border border-r-0 border-[var(--border)] bg-[var(--muted)] rounded-l-[var(--radius-lg)] h-[var(--input-height-standard)]">
            {leftAddon}
          </div>
        )}
        
        {leftIcon && !leftAddon && (
          <div className="absolute left-3 z-10 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          className={cn(
            inputVariants({ variant, size, state: finalState }),
            leftIcon && !leftAddon && "pl-10",
            rightIcon && !rightAddon && "pr-10",
            leftAddon && "rounded-l-none border-l-0",
            rightAddon && "rounded-r-none border-r-0",
            className
          )}
          ref={ref}
          style={{
            '--input-height-sm': theme.components.inputHeights.sm,
            '--input-height-standard': theme.components.inputHeights.standard,
            '--input-height-lg': theme.components.inputHeights.lg,
            '--text-size-standard-density': theme.typography.fontSizeScale.base,
            '--radius-lg': theme.components.borderRadius.lg,
            '--duration-normal': theme.animations.duration.normal,
          } as React.CSSProperties}
          {...props}
        />
        
        {rightIcon && !rightAddon && (
          <div className="absolute right-3 z-10 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
        
        {rightAddon && (
          <div className="flex items-center px-3 border border-l-0 border-[var(--border)] bg-[var(--muted)] rounded-r-[var(--radius-lg)] h-[var(--input-height-standard)]">
            {rightAddon}
          </div>
        )}
      </div>
    );
    
    if (!label && !helperText && !errorText) {
      return InputComponent;
    }
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--foreground)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        
        {InputComponent}
        
        {(helperText || errorText) && (
          <p className={cn(
            "text-sm",
            hasError ? "text-[var(--destructive)]" : "text-[var(--muted-foreground)]"
          )}>
            {errorText || helperText}
          </p>
        )}
      </div>
    );
  }
);

SystemInput.displayName = "SystemInput";

export { SystemInput, inputVariants };