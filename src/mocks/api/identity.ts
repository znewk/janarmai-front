import type { MockCheckResult } from '@/types/mock';
import { mockSuccess, mockError } from './mockRequest';

/**
 * Детерминированные сценарии ошибок мок-проверок (тех.план 2.3) — по последней цифре ИИН:
 * «9» → не найден в ГБД ФЛ; «8» → ФИО не совпадает с ИИН (ГБД ФЛ); «7» → телефон не привязан к ИИН (БМГ).
 * Любой другой ИИН — успех.
 */
export function checkGbdFl(params: { iin: string; fio: string }): Promise<MockCheckResult<{ iin: string; fio: string }>> {
  if (params.iin.endsWith('9')) return mockError('GBD_FL_NOT_FOUND');
  if (params.iin.endsWith('8')) return mockError('GBD_FL_MISMATCH');
  return mockSuccess({ iin: params.iin, fio: params.fio });
}

export function checkBmg(params: { iin: string; phone: string }): Promise<MockCheckResult<{ iin: string; phone: string }>> {
  if (params.iin.endsWith('7')) return mockError('BMG_PHONE_MISMATCH');
  return mockSuccess({ iin: params.iin, phone: params.phone });
}

/** Демо-код всегда «1234» — возвращается в data, чтобы UI мог подсказать его в демо-режиме. */
const DEMO_SMS_CODE = '1234';

export function sendSmsCode(phone: string): Promise<MockCheckResult<{ phone: string; demoCode: string }>> {
  return mockSuccess({ phone, demoCode: DEMO_SMS_CODE }, 400);
}

/** Верным считается только фиксированный демо-код; любой другой ввод — детерминированная ошибка. */
export function verifySmsCode(code: string): Promise<MockCheckResult<{ verified: true }>> {
  if (code !== DEMO_SMS_CODE) return mockError('SMS_INVALID_CODE');
  return mockSuccess({ verified: true });
}
