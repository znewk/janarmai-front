import type { MockCheckResult } from '@/types/mock';
import type { VehicleCategory } from '@/types/entities';
import { mockSuccess, mockError } from './mockRequest';

export interface MvdRegistryResult {
  /** ТС, зарегистрированные на пользователя — пустой массив, если своего ТС нет. Может быть больше одного (легковая + грузовая одновременно). */
  vehicles: { grnz: string; category: VehicleCategory }[];
  /** Действующий полис ОГПО (вписан в чужой полис) — актуально, когда своего ТС нет. */
  insured: boolean;
}

function lastDigitOf(value: string): string {
  const match = value.match(/\d(?!.*\d)/);
  return match ? match[0] : '2';
}

function buildDemoGrnz(identifier: string, category: VehicleCategory): string {
  const digits = (identifier.replace(/\D/g, '').slice(-3) || '000').padStart(3, '0');
  return category === 'passenger' ? `${digits}AAA02` : `A${digits}BC02`;
}

/**
 * Единый запрос к базе МВД (ТЗ 4.1–4.5, S-08): одним ответом определяет ТС, зарегистрированные
 * на пользователя, и наличие действующего полиса ОГПО (если своего ТС нет). Заменяет прежние
 * раздельные проверки ИС «Автомобиль» + база страховок ОГПО/ЕСБД (см. PROGRESS.md).
 * Сценарий ошибки: идентификатор (ИИН/паспорт) заканчивается на «6» → сервис недоступен/не найдено.
 * Демо-правило распределения: «0» → своего ТС нет, но есть полис ОГПО; «5» → сразу два ТС
 * (легковая + грузовая) — демонстрирует «1–2 карты, если несколько категорий ТС» (ТЗ S-10, ранее
 * это было воспроизводимо только через seed-данные, не через саму форму регистрации, см. правку
 * по замечанию ПМ в PROGRESS.md); чётная цифра (кроме «0») → легковая на пользователе; нечётная
 * (кроме «5»/«6») → грузовая. ГРНЗ генерируется детерминированно из идентификатора.
 */
export function checkMvdRegistry(identifier: string): Promise<MockCheckResult<MvdRegistryResult>> {
  const digit = lastDigitOf(identifier);
  if (digit === '6') return mockError('MVD_CHECK_FAILED');
  if (digit === '0') return mockSuccess({ vehicles: [], insured: true });
  if (digit === '5') {
    return mockSuccess({
      vehicles: [
        { grnz: buildDemoGrnz(identifier, 'passenger'), category: 'passenger' },
        { grnz: buildDemoGrnz(identifier, 'truck'), category: 'truck' },
      ],
      insured: false,
    });
  }
  const category: VehicleCategory = Number(digit) % 2 === 0 ? 'passenger' : 'truck';
  return mockSuccess({ vehicles: [{ grnz: buildDemoGrnz(identifier, category), category }], insured: false });
}
