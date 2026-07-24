import * as React from 'react';
import { cn } from '@/lib/utils';

/** React 18 (не 19) — рефы функциональным компонентам нужно прокидывать явно через forwardRef, иначе `react-hook-form` register()'у нечего цеплять. */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        'flex h-11 w-full min-w-0 rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-navy-900 shadow-xs outline-none transition-colors',
        'placeholder:text-gray-400',
        'focus-visible:border-navy-400 focus-visible:ring-2 focus-visible:ring-ring',
        'aria-invalid:border-status-blocked aria-invalid:ring-status-blocked/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
