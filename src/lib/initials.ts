/** Инициалы для аватар-заглушки — из ФИО берём первые буквы фамилии+имени, из названия компании — первые 2 буквы. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}
