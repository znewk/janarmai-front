import { Navigation, SignalHigh, Wifi, BatteryFull } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PhoneStatusBarProps {
  time?: string;
  timeClassName?: string;
  className?: string;
}

/**
 * Декоративная имитация статус-бара телефона (время + сигнал/wifi/батарея) — усиливает эффект
 * «это экран на реальном телефоне» внутри самого приложения, не только на мок-экранах eGov.
 */
export function PhoneStatusBar({ time = '07:59', timeClassName = 'text-gray-900', className }: PhoneStatusBarProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 pb-1 pt-3 text-[13px] font-semibold', className)}>
      <span className={cn('flex items-center gap-1', timeClassName)}>
        {time}
        <Navigation className="h-2.5 w-2.5 -rotate-45" fill="currentColor" />
      </span>
      <span className="flex items-center gap-1.5 text-gray-900">
        <SignalHigh className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-4 w-4" />
      </span>
    </div>
  );
}
