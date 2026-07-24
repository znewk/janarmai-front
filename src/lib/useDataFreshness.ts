import { useEffect, useState } from 'react';

const OFFSET_MINUTES_MIN = 2;
const OFFSET_MINUTES_MAX = 7;

function formatFreshness(): string {
  const offsetMinutes = OFFSET_MINUTES_MIN + Math.floor(Math.random() * (OFFSET_MINUTES_MAX - OFFSET_MINUTES_MIN));
  const freshAt = new Date(Date.now() - offsetMinutes * 60_000);
  return freshAt.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/**
 * «Данные актуальны на HH:MM, DD.MM» — реальное текущее время минус несколько минут, а не зашитая
 * строка (Analytics Deep Dive 2.3/4.1: простой, но сильный сигнал доверия). Пересчитывается раз в
 * минуту, пока страница открыта, чтобы отметка не «застывала».
 */
export function useDataFreshnessLabel(): string {
  const [label, setLabel] = useState(() => formatFreshness());
  useEffect(() => {
    const interval = setInterval(() => setLabel(formatFreshness()), 60_000);
    return () => clearInterval(interval);
  }, []);
  return label;
}
