import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, ScanLine, X } from 'lucide-react';
import { StepperStatus, type StepperStep } from '@/components/ui/StepperStatus';
import { useCardStore } from '@/store/card.store';
import { pickAutoFuelParams, simulateFueling, type FuelingResult } from '@/features/card/fuelingActions';
import { showToast } from '@/components/ui/toastStore';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';

export interface QrFullscreenModalProps {
  open: boolean;
  onClose: () => void;
  cardId: string;
  qrToken: string;
  holderName: string;
  maskedIdentifier: string;
  qrRefreshSeconds?: number;
}

type Phase = 'display' | 'scanning' | 'confirming' | 'success';

const SCAN_WAIT_MS = 3000;
const SCANNING_MS = 1300;
const CONFIRM_STEP_1_MS = 700;
const CONFIRM_STEP_2_MS = 1300;
const CONFIRM_DONE_MS = 1900;

/**
 * Полноэкранный показ QR — одновременно и «предъявление кассиру», и вся демо-симуляция заправки
 * (по запросу ПМ убрана отдельная кнопка/форма «Симулировать заправку», см. OPEN_QUESTIONS.md):
 * открыли QR → 3с ожидания → авто-имитация сканирования АЗС → степпер подтверждения отпуска
 * (те же 3 шага, что раньше были в S-20) → результат чеком прямо здесь. Объём/вид топлива
 * подбираются автоматически (`pickAutoFuelParams`) — правдоподобно, от остатка лимита карты.
 * Закрытие крестиком/Escape до момента подтверждения отменяет операцию (транзакция не пишется).
 */
export function QrFullscreenModal({ open, onClose, cardId, qrToken, holderName, maskedIdentifier, qrRefreshSeconds = 30 }: QrFullscreenModalProps) {
  const [phase, setPhase] = useState<Phase>('display');
  const [secondsLeft, setSecondsLeft] = useState(qrRefreshSeconds);
  const [steps, setSteps] = useState<StepperStep[]>([
    { id: 'check', label: 'Проверка лимита', status: 'pending' },
    { id: 'reserve', label: 'Резерв объёма', status: 'pending' },
    { id: 'confirm', label: 'Отпуск подтверждён АЗС', status: 'pending' },
  ]);
  const [result, setResult] = useState<FuelingResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase('display');
    setResult(null);
    setSteps([
      { id: 'check', label: 'Проверка лимита', status: 'pending' },
      { id: 'reserve', label: 'Резерв объёма', status: 'pending' },
      { id: 'confirm', label: 'Отпуск подтверждён АЗС', status: 'pending' },
    ]);

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('scanning'), SCAN_WAIT_MS));

    timers.push(
      setTimeout(() => {
        setPhase('confirming');
        setSteps((s) => s.map((step) => (step.id === 'check' ? { ...step, status: 'in_progress' } : step)));
      }, SCAN_WAIT_MS + SCANNING_MS),
    );

    timers.push(
      setTimeout(() => {
        setSteps((s) => s.map((step) => (step.id === 'check' ? { ...step, status: 'success' } : step.id === 'reserve' ? { ...step, status: 'in_progress' } : step)));
      }, SCAN_WAIT_MS + SCANNING_MS + CONFIRM_STEP_1_MS),
    );

    timers.push(
      setTimeout(() => {
        setSteps((s) => s.map((step) => (step.id === 'reserve' ? { ...step, status: 'success' } : step.id === 'confirm' ? { ...step, status: 'in_progress' } : step)));
      }, SCAN_WAIT_MS + SCANNING_MS + CONFIRM_STEP_2_MS),
    );

    timers.push(
      setTimeout(() => {
        const card = useCardStore.getState().cards.find((c) => c.id === cardId);
        if (!card) return;
        const { fuelType, volumeL } = pickAutoFuelParams(card);
        const fuelingResult = simulateFueling({ cardId, fuelType, volumeL });
        setSteps((s) => s.map((step) => (step.id === 'confirm' ? { ...step, status: 'success' } : step)));
        setResult(fuelingResult);
        setPhase('success');
        if (fuelingResult.warningThresholdReached) {
          showToast({ variant: 'warning', message: 'Достигнуто 80% суточного лимита' });
        }
      }, SCAN_WAIT_MS + SCANNING_MS + CONFIRM_DONE_MS),
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

  const priceLabel = useMemo(() => (result?.transaction.priceType === 'preferential' ? 'льготная цена' : 'предельная цена'), [result]);

  if (!open) return null;

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

        {phase === 'confirming' && (
          <div className="mt-8 w-full max-w-[280px] animate-modal-pop-in rounded-2xl bg-white p-4 text-left shadow-lg shadow-gray-200/60 ring-1 ring-gray-100">
            <p className="mb-4 text-center text-xs font-medium text-gray-500">Сотрудник АЗС подтверждает отпуск топлива…</p>
            <StepperStatus steps={steps} />
          </div>
        )}

        {phase === 'success' && result && (
          <div className="mt-6 flex w-full max-w-[300px] flex-col items-center animate-modal-pop-in">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-status-ok/10">
              <CheckCircle2 className="h-8 w-8 text-status-ok" />
            </span>
            <p className="mt-3 text-base font-semibold text-gray-900">Заправка подтверждена</p>
            <p className="text-xs text-gray-400">Запись добавлена в историю операций</p>

            <div className="mt-4 w-full space-y-2 rounded-2xl bg-gray-50 p-4 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">АЗС</span>
                <span className="font-medium text-gray-900">{result.transaction.stationName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Топливо</span>
                <span className="font-medium tabular-nums text-gray-900">
                  {result.transaction.volumeL} л · {FUEL_TYPE_LABEL[result.transaction.fuelType]}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Цена</span>
                <span className="font-medium text-gray-900">{priceLabel}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-sm">
                <span className="text-gray-500">Итого</span>
                <span className="font-semibold tabular-nums text-orange-600">{result.transaction.totalKzt.toLocaleString('ru-RU')} ₸</span>
              </div>
            </div>

            <button type="button" onClick={onClose} className="mt-5 w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white shadow-sm shadow-orange-500/30 transition-transform active:scale-[0.98]">
              Готово
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
