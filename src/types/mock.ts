/** Единый формат ответа имитируемых проверок внешних систем (тех.план раздел 2.3). */

export type MockErrorCode =
  | 'GBD_FL_NOT_FOUND'
  | 'GBD_FL_MISMATCH'
  | 'BMG_PHONE_MISMATCH'
  | 'SMS_INVALID_CODE'
  | 'BERKUT_DUPLICATE_PASSPORT'
  | 'BERKUT_NOT_FOUND'
  | 'MVD_CHECK_FAILED'
  | 'GBD_UL_NOT_FOUND'
  | 'ECP_SIGN_FAILED'
  | 'ADMIN_INVALID_CREDENTIALS';

export const MOCK_ERROR_MESSAGES: Record<MockErrorCode, string> = {
  GBD_FL_NOT_FOUND: 'ИИН не найден в ГБД ФЛ',
  GBD_FL_MISMATCH: 'ФИО не соответствует ИИН по данным ГБД ФЛ',
  BMG_PHONE_MISMATCH: 'Номер телефона не привязан к указанному ИИН (БМГ)',
  SMS_INVALID_CODE: 'Неверный код подтверждения',
  BERKUT_DUPLICATE_PASSPORT: 'Обнаружен дубликат паспорта в ИС «Беркут»',
  BERKUT_NOT_FOUND: 'Личность не подтверждена в ИС «Беркут»',
  MVD_CHECK_FAILED: 'Не удалось получить данные из базы МВД (ТС/страховка)',
  GBD_UL_NOT_FOUND: 'БИН не найден в ГБД ЮЛ',
  ECP_SIGN_FAILED: 'Не удалось подписать ЭЦП',
  ADMIN_INVALID_CREDENTIALS: 'Неверный логин или пароль',
};

export type MockCheckResult<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; errorCode: MockErrorCode; message: string };
