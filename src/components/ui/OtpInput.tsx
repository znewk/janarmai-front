import { useRef } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

/** Ввод SMS-кода — 6 ячеек (тех.план раздел 6), общий компонент для всех сценариев с SMS. */
export function OtpInput({ length = 6, value, onChange, error = false, disabled = false }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join('').slice(0, length));
  };

  const handleChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setDigit(index, '');
      return;
    }
    const chars = raw.split('');
    chars.forEach((char, offset) => {
      if (index + offset < length) setDigit(index + offset, char);
    });
    const nextIndex = Math.min(index + chars.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          className={`h-12 w-10 rounded-xl border text-center text-lg font-semibold text-gray-900 outline-none focus:border-navy-500 ${
            error ? 'border-status-blocked' : 'border-gray-200'
          } ${disabled ? 'bg-gray-50' : 'bg-white'}`}
        />
      ))}
    </div>
  );
}
