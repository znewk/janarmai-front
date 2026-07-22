/** Маскирование ИИН/БИН для карточки: «••••••1234» (ТЗ раздел 8.2). */
export function maskIdentifier(value: string | undefined): string {
  if (!value || value.length < 4) return '••••••••';
  const tail = value.slice(-4);
  return `${'•'.repeat(Math.max(value.length - 4, 6))}${tail}`;
}
