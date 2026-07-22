/** Генерация идентификаторов для рантайм-сущностей демо (регистрация, карты, транзакции). */
export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function generateQrToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24).toUpperCase();
}
