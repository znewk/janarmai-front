import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Стандартный shadcn/ui хелпер — merge Tailwind-классов с корректным разрешением конфликтов утилит. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
