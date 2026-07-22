import type { MockCheckResult } from '@/types/mock';
import type { AdminUser } from '@/types/entities';
import { adminUsersSeed } from '@/mocks/seed';
import { mockSuccess, mockError } from './mockRequest';

/** Проверка учётных данных служебного пользователя по моковому списку (ТЗ 4.7). */
export function checkAdminCredentials(login: string, password: string): Promise<MockCheckResult<AdminUser>> {
  const found = adminUsersSeed.find((a) => a.login === login && a.password === password);
  if (!found) return mockError('ADMIN_INVALID_CREDENTIALS');
  return mockSuccess(found);
}
