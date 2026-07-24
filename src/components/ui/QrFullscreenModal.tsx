import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, ScanLine, X } from 'lucide-react';
import { useCardStore } from '@/store/card.store';
import { pickAutoFuelParams, simulateFueling } from '@/features/card/fuelingActions';
import { showToast } from '@/components/ui/toastStore';
import { Button } from '@/components/ui/button';

export interface QrFullscreenModalProps {
  open: boolean;
  onClose: () => void;
  cardId: string;
  qrToken: string;
  holderName: string;
  maskedIdentifier: string;
  qrRefreshSeconds?: number;
}

type Phase = 'display' | 'scanning' | 'confirmed';

const SCAN_WAIT_MS = 3000;
const SCANNING_MS = 1300;

/**
 * Полноэкранный показ QR — «предъявление кассиру»: открыли QR → 3с ожидания → авто-имитация
 * сканирования АЗС → подтверждение факта сканирования. По прямому указанию пользователя (реализм
 * флоу): держатель карты в реальности НЕ видит внутренние проверки/резерв лимита и не получает
 * мгновенный чек — это делает касса АЗС на своей стороне и асинхронно шлёт результат в сервис;
 * пользователь узнаёт детали заправки (объём/топливо/сумма) только позже, в истории операций.
 * Поэтому здесь после сканирования нет ни степпера проверок, ни чека — только факт «QR принят»,
 * а сама демо-транзакция (`simulateFueling`) пишется в фоне, без отображения в этой модалке.
 * Закрытие крестиком/Escape до момента сканирования отменяет операцию (транзакция не пишется).
 */
export function QrFullscreenModal({ open, onClose, cardId, qrToken, holderName, maskedIdentifier, qrRefreshSeconds = 30 }: QrFullscreenModalProps) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('display');
  const [secondsLeft, setSecondsLeft] = useState(qrRefreshSeconds);

  useEffect(() => {
    if (!open) return;
    setPhase('display');

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('scanning'), SCAN_WAIT_MS));

    timers.push(
      setTimeout(() => {
        setPhase('confirmed');
        // Отпуск топлива и расчёт суммы — на стороне АЗС/бэкенда, пользователю не показываются.
        // В демо транзакция всё равно создаётся здесь же (без реального бэкенда), но молча —
        // держатель карты увидит её позже сам, открыв историю операций.
        const card = useCardStore.getState().cards.find((c) => c.id === cardId);
        if (!card) return;
        const { fuelType, volumeL } = pickAutoFuelParams(card);
        const fuelingResult = simulateFueling({ cardId, fuelType, volumeL });
        if (fuelingResult.warningThresholdReached) {
          showToast({ variant: 'warning', message: 'Достигнуто 80% суточного лимита' });
        }
      }, SCAN_WAIT_MS + SCANNING_MS),
    );

    return () => timers.forEach(clearTimeout);
  }, [open, cardId]);

  useEffect(() => {
    if (!open || phase !== 'display') return;
    setSecondsLeft(qrRefreshSeconds);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? qrRefreshSeconds : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [open, phase, qrToken, qrRefreshSeconds]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const goToHistory = () => {
    onClose();
    navigate('/cabinet/history');
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white animate-backdrop-fade-in" role="dialog" aria-modal="true">
      <button type="button" onClick={onClose} aria-label="Закрыть" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:scale-90 transition-transform">
        <X className="h-5 w-5" />
      </button>

      <div className="flex w-full flex-col items-center px-8 text-center">
        <p className="text-sm font-semibold text-gray-900">{holderName}</p>
        <p className="mt-0.5 text-xs tabular-nums text-gray-400">{maskedIdentifier}</p>

        {phase === 'display' && (
          <div className="flex flex-col items-center animate-modal-pop-in">
            <div className="mt-8 rounded-[28px] bg-white p-4 shadow-2xl shadow-gray-300/60 ring-1 ring-gray-100">
              <QRCodeSVG value={qrToken} size={260} level="M" />
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-ok opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-status-ok" />
              </span>
              <p className="text-xs font-medium tabular-nums text-gray-600">Ожидание сканирования · {secondsLeft}с</p>
            </div>
            <p className="mt-4 max-w-[260px] text-xs text-gray-400">Покажите этот экран кассиру на АЗС для сканирования</p>
          </div>
        )}

        {phase === 'scanning' && (
          <div className="flex flex-col items-center animate-modal-pop-in">
            <div className="relative mt-8 flex h-[260px] w-[260px] items-center justify-center overflow-hidden rounded-[28px] bg-navy-50 ring-1 ring-navy-100">
              <QRCodeSVG value={qrToken} size={260} level="M" className="opacity-30" />
              <span className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-scan-sweep" />
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5">
              <ScanLine className="h-3.5 w-3.5 animate-pulse text-orange-600" />
              <p className="text-xs font-medium text-orange-600">АЗС сканирует QR-код…</p>
            </div>
          </div>
        )}

        {phase === 'confirmed' && (
          <div className="mt-6 flex w-full max-w-[280px] flex-col items-center animate-modal-pop-in">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-status-ok/10">
              <CheckCircle2 className="h-9 w-9 text-status-ok" />
            </span>
            <p className="mt-4 text-base font-semibold text-gray-900">QR-код принят</p>
            <p className="mt-1 text-sm text-gray-500">Сотрудник АЗС завершит отпуск топлива. Заправка появится в истории операций.</p>

            <div className="mt-6 flex w-full flex-col gap-2">
              <Button type="button" onClick={goToHistory} className="w-full">
                Перейти в историю
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="w-full">
                Готово
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
