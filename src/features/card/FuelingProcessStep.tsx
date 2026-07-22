import { useEffect, useState } from 'react';
import type { FuelType } from '@/types/entities';
import { StepperStatus, type StepperStep } from '@/components/ui/StepperStatus';
import { simulateFueling, type FuelingResult } from './fuelingActions';

interface Props {
  cardId: string;
  fuelType: FuelType;
  volumeL: number;
  onComplete: (result: FuelingResult) => void;
}

/** S-20 — степпер операции: проверка лимита → резерв объёма → отпуск подтверждён (ТЗ 5.0, «< 2 секунды»). */
export function FuelingProcessStep({ cardId, fuelType, volumeL, onComplete }: Props) {
  const [steps, setSteps] = useState<StepperStep[]>([
    { id: 'check', label: 'Проверка лимита', status: 'in_progress' },
    { id: 'reserve', label: 'Резерв объёма', status: 'pending' },
    { id: 'confirm', label: 'Отпуск подтверждён', status: 'pending' },
  ]);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        setSteps((s) => s.map((step) => (step.id === 'check' ? { ...step, status: 'success' } : step.id === 'reserve' ? { ...step, status: 'in_progress' } : step)));
      }, 700),
    );

    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        setSteps((s) => s.map((step) => (step.id === 'reserve' ? { ...step, status: 'success' } : step.id === 'confirm' ? { ...step, status: 'in_progress' } : step)));
      }, 1300),
    );

    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        const result = simulateFueling({ cardId, fuelType, volumeL });
        setSteps((s) => s.map((step) => (step.id === 'confirm' ? { ...step, status: 'success' } : step)));
        onComplete(result);
      }, 1900),
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [cardId, fuelType, volumeL, onComplete]);

  return <StepperStatus steps={steps} />;
}
