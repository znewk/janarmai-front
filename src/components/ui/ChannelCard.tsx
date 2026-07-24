import type { ComponentType } from 'react';
import { ChevronRight } from 'lucide-react';

export interface ChannelCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/** Карточка выбора канала входа — eGov Mobile / Приложение БВУ / Приложение КМГ (S-00, ТЗ 4.0). */
export function ChannelCard({ icon: Icon, title, subtitle, onClick, disabled = false }: ChannelCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm shadow-gray-200/60 transition ${
        disabled ? 'cursor-not-allowed opacity-40' : 'active:scale-[0.99]'
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-600">
        <Icon className="h-5 w-5 text-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-gray-900">{title}</span>
        {subtitle && <span className="block text-xs text-gray-400">{subtitle}</span>}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
    </button>
  );
}
