import { QRCodeSVG } from 'qrcode.react';
import { Fuel, Maximize2 } from 'lucide-react';

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
  /** Если передан — QR становится тапабельным, открывает полноэкранный показ (для сканирования кассиром). */
  onExpandQr?: () => void;
}

function formatBackupCode(qrToken: string): string {
  const digits = qrToken.slice(0, 12).padEnd(12, '0');
  return digits.match(/.{1,4}/g)!.join(' ');
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
  onExpandQr,
}: CardMunaiProps) {
  const qrContent = (
    <>
      <QRCodeSVG value={qrToken} size={72} level="M" />
      {onExpandQr && (
        <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 shadow-sm">
          <Maximize2 className="h-2.5 w-2.5 text-white" />
        </span>
      )}
    </>
  );

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 p-5 text-white shadow-xl shadow-navy-900/30 ${inactive ? 'opacity-50 grayscale' : ''}`}
    >
      {/* декоративные блики — карта не выглядит плоской заглушкой */}
      <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/[0.06]" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-orange-500/10" />
      <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/10" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 shadow-sm shadow-orange-950/40">
            <Fuel className="h-5 w-5 text-white" />
          </div>
          <p className="mt-3 truncate text-base font-semibold">{holderName}</p>
          <p className="text-sm tabular-nums text-navy-200">{maskedIdentifier}</p>
          <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-navy-100">{cardLabel}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          {onExpandQr ? (
            <button type="button" onClick={onExpandQr} aria-label="Показать QR на весь экран" className="relative rounded-xl bg-white p-1.5 transition-transform active:scale-95">
              {qrContent}
            </button>
          ) : (
            <div className="relative rounded-xl bg-white p-1.5">{qrContent}</div>
          )}
          <p className="text-[10px] text-navy-300">QR обновляется каждые {qrRefreshSeconds}с</p>
          <p className="text-[10px] tracking-wide text-navy-400 tabular-nums">{formatBackupCode(qrToken)}</p>
        </div>
      </div>

      <div className="relative mt-5">
        <p className="text-xs text-navy-300">Остаток лимита на сегодня</p>
        <p className="text-2xl font-bold text-orange-400 tabular-nums">{remainingLabel}</p>
      </div>
    </div>
  );
}
