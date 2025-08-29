import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../components/ui/utils';
import { useDesignSystem } from '../contexts/DesignSystemContext';

// Define button variants using the design system
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-lg)] font-medium transition-all duration-[var(--duration-normal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 shadow-lg hover:shadow-xl",
        destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]/90",
        outline: "border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
        secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80",
        ghost: "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
        link: "text-[var(--primary)] underline-offset-4 hover:underline",
        brand: "bg-[var(--healthscan-green)] text-white hover:bg-[var(--healthscan-green)]/90 shadow-lg hover:shadow-xl",
        brandOutline: "border border-[var(--healthscan-green)] text-[var(--healthscan-green)] hover:bg-[var(--healthscan-green)] hover:text-white",
        gradient: "bg-gradient-to-r from-[var(--healthscan-green)] to-[var(--healthscan-light-green)] text-white hover:from-[var(--healthscan-green)]/90 hover:to-[var(--healthscan-light-green)]/90 shadow-lg hover:shadow-xl",
        success: "bg-[var(--success)] text-[var(--success-foreground)] hover:bg-[var(--success)]/90",
        warning: "bg-[var(--warning)] text-[var(--warning-foreground)] hover:bg-[var(--warning)]/90",
      },
      size: {
        sm: "h-[var(--button-height-sm)] px-3 text-sm",
        default: "h-[var(--button-height-standard)] px-4 py-2",
        lg: "h-[var(--button-height-lg)] px-8",
        icon: "h-[var(--button-height-standard)] w-[var(--button-height-standard)]",
      },
      density: {
        major: "text-[var(--text-size-major-cta)] font-medium",
        standard: "text-[var(--text-size-standard-density)] font-normal",
      },
      animation: {
        none: "",
        hover: "hover:scale-[1.02] active:scale-[0.98]",
        bounce: "hover:animate-pulse",
        shake: "hover:animate-bounce",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      density: "standard",
      animation: "hover",
    },
  }
);

export interface SystemButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const SystemButton = forwardRef<HTMLButtonElement, SystemButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    density, 
    animation, 
    asChild = false, 
    loading = false,
    icon,
    iconPosition = 'left',
    disabled,
    children,
    ...props 
  }, ref) => {
    const { theme } = useDesignSystem();
    const Comp = asChild ? Slot : "button";
    
    const isDisabled = disabled || loading;
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, density, animation, className }))}
        ref={ref}
        disabled={isDisabled}
        style={{
          '--button-height-sm': theme.components.buttonHeights.sm,
          '--button-height-standard': theme.components.buttonHeights.standard,
          '--button-height-lg': theme.components.buttonHeights.lg,
          '--text-size-major-cta': theme.typography.fontSizeScale.lg,
          '--text-size-standard-density': theme.typography.fontSizeScale.base,
          '--radius-lg': theme.components.borderRadius.lg,
          '--duration-normal': theme.animations.duration.normal,
        } as React.CSSProperties}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        <div className={cn("flex items-center gap-2", loading && "opacity-0")}>
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </div>
      </Comp>
    );
  }
);

SystemButton.displayName = "SystemButton";

export { SystemButton, buttonVariants };