import { useEffect, useRef, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Маленький кликабельный «?» с всплывающим пояснением — для показателей, где не очевидно, как считается значение (например, статус региона). Клик вне попапа закрывает его. */
export function InfoTooltip({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <span ref={ref} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-3.5 w-3.5 items-center justify-center text-navy-300 hover:text-navy-500"
        aria-label="Пояснение"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          onClick={(e) => e.stopPropagation()}
          className="absolute left-1/2 top-full z-20 mt-1.5 w-64 -translate-x-1/2 rounded-lg border border-navy-100 bg-white p-2.5 text-left text-[11px] leading-snug font-normal normal-case text-navy-600 shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
