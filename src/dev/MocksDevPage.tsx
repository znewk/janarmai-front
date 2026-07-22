import { useState } from 'react';
import * as api from '@/mocks/api';
import { useUserStore, useCardStore, useTransactionStore, useAdminStore, resetDemoData } from '@/store';

type Check = { label: string; run: () => Promise<unknown> };

const checks: Check[] = [
  { label: 'checkGbdFl (успех)', run: () => api.checkGbdFl({ iin: '900101300123', fio: 'Тест Тестов' }) },
  { label: 'checkGbdFl (ошибка: не найден, ИИН на 9)', run: () => api.checkGbdFl({ iin: '900101300129', fio: 'Тест Тестов' }) },
  { label: 'checkBmg (ошибка: телефон, ИИН на 7)', run: () => api.checkBmg({ iin: '900101300127', phone: '+77011112233' }) },
  { label: 'sendSmsCode', run: () => api.sendSmsCode('+77011112233') },
  { label: 'verifySmsCode (неверный)', run: () => api.verifySmsCode('9999') },
  { label: 'checkBerkut (дубликат паспорта)', run: () => api.checkBerkut({ passportNumber: 'DUP12345' }) },
  { label: 'checkVehicleRegistry (не найдено)', run: () => api.checkVehicleRegistry('ERR001') },
  { label: 'checkGbdUl (успех)', run: () => api.checkGbdUl('123456789012') },
  { label: 'checkAdminCredentials (успех)', run: () => api.checkAdminCredentials('kmg.analyst', 'demo1234') },
  { label: 'checkAdminCredentials (ошибка)', run: () => api.checkAdminCredentials('kmg.analyst', 'wrong') },
];

export function MocksDevPage() {
  const [log, setLog] = useState<{ label: string; pending: boolean; result?: unknown }[]>([]);
  const users = useUserStore((s) => s.users);
  const cards = useCardStore((s) => s.cards);
  const transactions = useTransactionStore((s) => s.transactions);
  const adminId = useAdminStore((s) => s.currentAdminId);
  const adminLogin = useAdminStore((s) => s.login);

  const runCheck = async (check: Check) => {
    setLog((l) => [{ label: check.label, pending: true }, ...l]);
    const result = await check.run();
    setLog((l) => l.map((entry) => (entry.label === check.label && entry.pending ? { ...entry, pending: false, result } : entry)));
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-bold text-navy-900">/dev/mocks — проверка мок-слоя (Этап 1)</h1>

      <section>
        <h2 className="mb-2 font-semibold text-navy-700">Сторы (persist в localStorage)</h2>
        <ul className="space-y-1 text-sm">
          <li>users: {users.length}</li>
          <li>cards: {cards.length}</li>
          <li>transactions: {transactions.length}</li>
          <li>admin session: {adminId ?? 'не авторизован'}</li>
        </ul>
        <div className="mt-2 flex gap-2">
          <button className="rounded bg-navy-600 px-3 py-1.5 text-sm text-white" onClick={() => adminLogin('admin_kmg')}>
            Войти как admin_kmg (проверка persist)
          </button>
          <button className="rounded bg-orange-500 px-3 py-1.5 text-sm text-white" onClick={resetDemoData}>
            Сбросить демо-данные
          </button>
        </div>
        <p className="mt-2 text-xs text-navy-400">Обновите страницу (F5) — счётчики и admin session должны сохраниться.</p>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-navy-700">Мок-проверки (status/data/errorCode + задержка)</h2>
        <div className="flex flex-wrap gap-2">
          {checks.map((check) => (
            <button key={check.label} className="rounded border border-navy-300 px-2 py-1 text-xs" onClick={() => runCheck(check)}>
              {check.label}
            </button>
          ))}
        </div>
        <ul className="mt-3 space-y-2 text-xs">
          {log.map((entry, i) => (
            <li key={i} className="rounded border border-navy-100 p-2">
              <div className="font-semibold">{entry.label}</div>
              <pre className="overflow-x-auto">{entry.pending ? '...загрузка...' : JSON.stringify(entry.result, null, 2)}</pre>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
