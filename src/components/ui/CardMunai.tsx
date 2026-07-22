import { QRCodeSVG } from 'qrcode.react';
import { Fuel } from 'lucide-react';

export interface CardMunaiProps {
  /** ФИО держателя (ФЛ) или название компании (ЮЛ). */
  holderName: string;
  /** Маскированный ИИН/БИН — «••••••1234» (8.2). */
  maskedIdentifier: string;
  /** Подпись типа карты: «ФЛ · легковая», «ЮЛ · грузовая · 001AAA02» и т.п. */
  cardLabel: string;
  qrToken: string;
  /** Текст остатка лимита крупным акцентным шрифтом; для карт без потолка — «без лимита». */
  remainingLabel: string;
  qrRefreshSeconds?: number;
  inactive?: boolean;
}

/** Карточка пользователя MunaiCard — тёмно-синяя wallet-карта (ТЗ 8.2). */
export function CardMunai({
  holderName,
  maskedIdentifier,
  cardLabel,
  qrToken,
  remainingLabel,
  qrRefreshSeconds = 30,
  inactive = false,
}: CardMunaiProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 p-5 text-white shadow-lg ${inactive ? 'opacity-50 grayscale' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500">
            <Fuel className="h-5 w-5 text-white" />
          </div>
          <p className="mt-3 truncate text-base font-semibold">{holderName}</p>
          <p className="text-sm text-navy-200">{maskedIdentifier}</p>
          <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-navy-100">{cardLabel}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="rounded-lg bg-white p-1.5">
            <QRCodeSVG value={qrToken} size={72} level="M" />
          </div>
          <p className="text-[10px] text-navy-300">QR обновляется каждые {qrRefreshSeconds}с</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs text-navy-300">Остаток лимита на сегодня</p>
        <p className="text-2xl font-bold text-orange-400">{remainingLabel}</p>
      </div>
    </div>
  );
}
