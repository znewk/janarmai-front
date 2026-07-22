import type { MockCheckResult } from '@/types/mock';
import type { VehicleCategory } from '@/types/entities';
import { mockSuccess, mockError } from './mockRequest';

/**
 * Проверка ИС «Автомобиль» (категория/класс ТС по ГРНЗ, ТЗ 4.1–4.5, S-08).
 * Сценарий ошибки: ГРНЗ содержит подстроку «ERR» → ТС не найдено.
 * Категория определяется детерминированно по первому символу ГРНЗ: цифра — легковая, буква — грузовая
 * (упрощённое демо-правило, реального формата ГРНЗ РК не требуется для мок-слоя).
 */
export function checkVehicleRegistry(grnz: string): Promise<MockCheckResult<{ grnz: string; category: VehicleCategory }>> {
  if (grnz.toUpperCase().includes('ERR')) return mockError('VEHICLE_NOT_FOUND');
  const category: VehicleCategory = /^[0-9]/.test(grnz) ? 'passenger' : 'truck';
  return mockSuccess({ grnz, category });
}

/**
 * Проверка базы страховок ОГПО / ЕСБД ГКБ НБ РК (вписан ли заявитель в чужой полис) — когда своего ТС нет.
 * Сценарий ошибки: ИИН заканчивается на «6» → запись не найдена.
 */
export function checkOgpoInsurance(iin: string): Promise<MockCheckResult<{ insured: true }>> {
  if (iin.endsWith('6')) return mockError('OGPO_NOT_INSURED');
  return mockSuccess({ insured: true });
}
