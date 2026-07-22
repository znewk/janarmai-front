import type { MockCheckResult, MockErrorCode } from '@/types/mock';
import { MOCK_ERROR_MESSAGES } from '@/types/mock';
import { randomDelay } from './config';

/** Единая обёртка сетевой имитации: Promise с искусственной задержкой (тех.план раздел 2.3). */
export function mockSuccess<T>(data: T, delayMs: number = randomDelay()): Promise<MockCheckResult<T>> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ status: 'success', data }), delayMs);
  });
}

export function mockError<T = never>(errorCode: MockErrorCode, delayMs: number = randomDelay()): Promise<MockCheckResult<T>> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ status: 'error', errorCode, message: MOCK_ERROR_MESSAGES[errorCode] }), delayMs);
  });
}
