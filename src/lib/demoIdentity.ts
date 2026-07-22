/** Генерация случайной, но детерминированно «чистой» (без кодов ошибок) демо-личности для быстрых веток регистрации. */

const FIO_POOL = [
  'Байжанов Ерлан Асхатович',
  'Нурлыбекова Аружан Ержановна',
  'Сагындыков Дамир Тимурович',
  'Омарова Динара Асановна',
  'Кенжебаев Арман Болатович',
  'Жаксыбекова Айгуль Нурлановна',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Последняя цифра ИИН/БИН/телефона намеренно избегает кодов ошибок 6/7/8/9 (см. OPEN_QUESTIONS.md). */
function safeDigit(): string {
  return String(Math.floor(Math.random() * 6)); // 0-5
}

export function generateDemoIin(): string {
  const yy = String(70 + Math.floor(Math.random() * 30)).padStart(2, '0');
  const mm = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const dd = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  const mid = String(Math.floor(Math.random() * 900) + 100);
  return `${yy}${mm}${dd}${mid}${safeDigit()}`;
}

export function generateDemoBin(): string {
  return `1${String(Math.floor(Math.random() * 10 ** 10)).padStart(10, '0').slice(0, 10)}${safeDigit()}`;
}

export function generateDemoPhone(): string {
  return `+7701${String(Math.floor(Math.random() * 10 ** 7)).padStart(7, '0')}`;
}

export function generateDemoFio(): string {
  return randomFrom(FIO_POOL);
}
