import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, LogOut, RotateCcw, Trash2, X } from 'lucide-react';
import type { VehicleCategory } from '@/types/entities';
import { LimitProgressBar } from '@/components/ui/LimitProgressBar';
import { useUserStore } from '@/store/user.store';
import { useCardStore } from '@/store/card.store';
import { useTransactionStore } from '@/store/transaction.store';
import { addFleetVehicle, deactivateVehicle, assignDriver, unassignDriver } from './fleetActions';
import { exportFleetReportCsv } from './exportReport';
import { getInitials } from '@/lib/initials';
import { resetDemoData } from '@/store';

const CATEGORY_LABEL: Record<VehicleCategory, string> = { passenger: 'легковая', truck: 'грузовая' };

/** S-24 — кабинет ЮЛ: сводная таблица автопарка + S-26 управление ТС/водителями + S-27 экспорт отчёта (ТЗ 5.2). */
export function CabinetUlPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentCompanyId = useUserStore((s) => s.currentCompanyId);
  const companies = useUserStore((s) => s.companies);
  const allVehicles = useUserStore((s) => s.vehicles);
  const allDrivers = useUserStore((s) => s.drivers);
  const logout = useUserStore((s) => s.logout);
  const cards = useCardStore((s) => s.cards);
  const transactions = useTransactionStore((s) => s.transactions);

  const [showIssuedBanner, setShowIssuedBanner] = useState(() => Boolean((location.state as { justIssued?: boolean } | null)?.justIssued));
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newGrnz, setNewGrnz] = useState('');
  const [newCategory, setNewCategory] = useState<VehicleCategory>('passenger');
  const [driverFormFor, setDriverFormFor] = useState<string | null>(null);
  const [driverFio, setDriverFio] = useState('');
  const [driverIin, setDriverIin] = useState('');

  const company = companies.find((c) => c.id === currentCompanyId);
  const fleetVehicles = allVehicles.filter((v) => v.ownerId === currentCompanyId && v.active);
  const fleetCardIds = fleetVehicles.map((v) => cards.find((c) => c.vehicleId === v.id)?.id).filter((id): id is string => !!id);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleReset = () => {
    resetDemoData();
    navigate('/');
  };

  if (!company) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-status-blocked">Нет активной сессии ЮЛ — сначала войдите или зарегистрируйтесь.</p>
        <button type="button" onClick={() => navigate('/')} className="mt-4 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
          На главную
        </button>
      </div>
    );
  }

  const handleAddVehicle = () => {
    if (!newGrnz.trim()) return;
    addFleetVehicle({
      companyId: company.id,
      residency: company.residency,
      companyIdentifier: company.bin ?? company.registrationNumber ?? '',
      grnz: newGrnz.trim().toUpperCase(),
      category: newCategory,
    });
    setNewGrnz('');
    setShowAddVehicle(false);
  };

  const handleAssignDriver = (vehicleId: string) => {
    if (!driverFio.trim() || !driverIin.trim()) return;
    assignDriver({ companyId: company.id, vehicleId, fio: driverFio.trim(), iin: driverIin.trim() });
    setDriverFormFor(null);
    setDriverFio('');
    setDriverIin('');
  };

  const handleExport = () => {
    const fleetTransactions = transactions.filter((t) => fleetCardIds.includes(t.cardId));
    exportFleetReportCsv({ companyName: company.name, transactions: fleetTransactions, cards, vehicles: allVehicles, drivers: allDrivers });
  };

  return (
    <div className="space-y-6 p-4">
      {showIssuedBanner && (
        <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm shadow-gray-200/60">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-ok" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Карты успешно выпущены</p>
            <p className="text-xs text-gray-500">По каждому ТС автопарка выпущена отдельная карта — остаток лимита виден ниже.</p>
          </div>
          <button type="button" onClick={() => setShowIssuedBanner(false)} aria-label="Закрыть" className="text-gray-300 hover:text-gray-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 text-sm font-semibold text-white shadow-sm shadow-navy-900/20">
            {getInitials(company.name)}
          </span>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Кабинет ЮЛ</p>
            <h1 className="truncate text-lg font-bold text-gray-900">{company.name}</h1>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm shadow-gray-200/60 transition-transform active:scale-95">
          <LogOut className="h-3.5 w-3.5" />
          Выйти
        </button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Автопарк</h2>
          <button type="button" onClick={() => setShowAddVehicle((v) => !v)} className="text-xs font-semibold text-orange-600 transition-transform active:scale-95">
            + Добавить ТС
          </button>
        </div>

        {showAddVehicle && (
          <div className="mb-3 space-y-2 rounded-2xl bg-white p-3 shadow-sm shadow-gray-200/60">
            <input value={newGrnz} onChange={(e) => setNewGrnz(e.target.value)} placeholder="ГРНЗ" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            <div className="flex gap-2">
              {(['passenger', 'truck'] as VehicleCategory[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCategory(c)}
                  className={`flex-1 rounded-xl border py-2 text-sm ${newCategory === c ? 'border-navy-600 bg-navy-600 text-white' : 'border-gray-200 text-gray-700'}`}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
            <button type="button" onClick={handleAddVehicle} disabled={!newGrnz.trim()} className="w-full rounded-xl bg-orange-500 py-2 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100">
              Добавить и выпустить карту
            </button>
          </div>
        )}

        <div className="space-y-3">
          {fleetVehicles.map((vehicle) => {
            const card = cards.find((c) => c.vehicleId === vehicle.id);
            const driver = vehicle.driverId ? allDrivers.find((d) => d.id === vehicle.driverId) : undefined;
            return (
              <div key={vehicle.id} className="rounded-2xl bg-white p-3 shadow-sm shadow-gray-200/60">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {vehicle.grnz} · {CATEGORY_LABEL[vehicle.category]}
                    </p>
                    <p className="text-xs text-gray-400">{driver ? `Водитель: ${driver.fio}` : 'Водитель не назначен'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deactivateVehicle(vehicle.id, card?.id)}
                    aria-label="Деактивировать ТС"
                    className="text-gray-300 transition-transform hover:text-status-blocked active:scale-90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {card && (
                  <div className="mt-2">
                    <LimitProgressBar usedL={card.usedTodayL} limitL={card.dailyLimitL} />
                  </div>
                )}

                <div className="mt-2 flex gap-2 text-xs">
                  {driver ? (
                    <button type="button" onClick={() => unassignDriver(vehicle.id, driver.id)} className="font-semibold text-gray-500">
                      Снять водителя
                    </button>
                  ) : (
                    <button type="button" onClick={() => setDriverFormFor(vehicle.id)} className="font-semibold text-gray-500">
                      Назначить водителя
                    </button>
                  )}
                </div>

                {driverFormFor === vehicle.id && (
                  <div className="mt-2 space-y-2 rounded-xl bg-gray-50 p-2">
                    <input value={driverFio} onChange={(e) => setDriverFio(e.target.value)} placeholder="ФИО водителя" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs" />
                    <input value={driverIin} onChange={(e) => setDriverIin(e.target.value)} placeholder="ИИН водителя" className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs" />
                    <button type="button" onClick={() => handleAssignDriver(vehicle.id)} className="w-full rounded-lg bg-navy-600 py-1.5 text-xs font-semibold text-white">
                      Сохранить
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {fleetVehicles.length === 0 && <p className="text-sm text-gray-400">В автопарке нет активных ТС.</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => navigate('/cabinet/history')} className="flex-1 rounded-2xl bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm shadow-gray-200/60 transition-transform active:scale-[0.98]">
          История заправок
        </button>
        <button type="button" onClick={handleExport} className="flex-1 rounded-2xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-500/30 transition-transform active:scale-[0.98]">
          Скачать отчёт
        </button>
      </div>

      <button type="button" onClick={handleReset} className="flex w-full items-center justify-center gap-2 py-2 text-xs font-medium text-gray-400">
        <RotateCcw className="h-3.5 w-3.5" />
        Сбросить демо-данные
      </button>
    </div>
  );
}
