import type { MockCheckResult } from '@/types/mock';
import { mockSuccess, mockError } from './mockRequest';

/**
 * Проверка ГБД ЮЛ по БИН → подтягивание названия компании (мок, ТЗ 4.4).
 * Сценарий ошибки: БИН заканчивается на «9» → не найден.
 */
export function checkGbdUl(bin: string): Promise<MockCheckResult<{ bin: string; name: string }>> {
  if (bin.endsWith('9')) return mockError('GBD_UL_NOT_FOUND');
  return mockSuccess({ bin, name: 'ТОО «Компания» (мок из ГБД ЮЛ)' });
}

/** Демо-код подписания ЭЦП — «1234», как и для SMS (единый мок-паттерн подтверждения). */
const DEMO_ECP_CODE = '1234';

export function signEcp(code: string): Promise<MockCheckResult<{ signed: true }>> {
  if (code !== DEMO_ECP_CODE) return mockError('ECP_SIGN_FAILED');
  return mockSuccess({ signed: true }, 700);
}
