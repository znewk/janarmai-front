import type { MockCheckResult } from '@/types/mock';
import { mockSuccess, mockError } from './mockRequest';

/** Имитация liveness-проверки (селфи-шаг) — в демо всегда успешна после «загрузки» кадра. */
export function verifyLiveness(): Promise<MockCheckResult<{ liveness: true }>> {
  return mockSuccess({ liveness: true }, 800);
}

/**
 * Проверка ИС «Беркут» (личность + факт въезда, ТЗ 4.3/4.5).
 * Сценарий ошибки: номер паспорта содержит подстроку «DUP» → отказ «дубликат паспорта».
 * Номер паспорта содержит подстроку «NF» → личность не подтверждена (не найдена запись о въезде).
 */
export function checkBerkut(params: { passportNumber: string }): Promise<MockCheckResult<{ passportNumber: string; entryConfirmed: true }>> {
  if (params.passportNumber.toUpperCase().includes('DUP')) return mockError('BERKUT_DUPLICATE_PASSPORT');
  if (params.passportNumber.toUpperCase().includes('NF')) return mockError('BERKUT_NOT_FOUND');
  return mockSuccess({ passportNumber: params.passportNumber, entryConfirmed: true });
}
