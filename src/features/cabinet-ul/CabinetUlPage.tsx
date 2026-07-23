import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Trash2, X } from 'lucide-react';
import type { VehicleCategory } from '@/types/entities';
import { LimitProgressBar } from '@/components/ui/LimitProgressBar';
import { useUserStore } from '@/store/user.store';
import { useCardStore } from '@/store/card.store';
import { useTransactionStore } from '@/store/transaction.store';
import { addFleetVehicle, deactivateVehicle, assignDriver, unassignDriver } from './fleetActions';
import { exportFleetReportCsv } from './exportReport';

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

  if (!company) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-status-blocked">Нет активной сессии ЮЛ — сначала войдите или зарегистрируйтесь.</p>
        <button type="button" onClick={() => navigate('/')} className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
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
        <div className="flex items-start gap-3 rounded-xl border border-status-ok bg-navy-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-ok" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy-900">Карты успешно выпущены</p>
            <p className="text-xs text-navy-500">По каждому ТС автопарка выпущена отдельная карта — остаток лимита виден ниже.</p>
          </div>
          <button type="button" onClick={() => setShowIssuedBanner(false)} aria-label="Закрыть" className="text-navy-300 hover:text-navy-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-navy-400">Кабинет ЮЛ</p>
          <h1 className="text-lg font-bold text-navy-900">{company.name}</h1>
        </div>
        <button type="button" onClick={handleLogout} className="text-xs font-semibold text-navy-500">
          Выйти
        </button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-700">Автопарк</h2>
          <button type="button" onClick={() => setShowAddVehicle((v) => !v)} className="text-xs font-semibold text-orange-600">
            + Добавить ТС
          </button>
        </div>

        {showAddVehicle && (
          <div className="mb-3 space-y-2 rounded-xl border border-navy-100 p-3">
            <input value={newGrnz} onChange={(e) => setNewGrnz(e.target.value)} placeholder="ГРНЗ" className="w-full rounded-lg border border-navy-200 px-3 py-2 text-sm" />
            <div className="flex gap-2">
              {(['passenger', 'truck'] as VehicleCategory[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCategory(c)}
                  className={`flex-1 rounded-lg border py-2 text-sm ${newCategory === c ? 'border-navy-600 bg-navy-600 text-white' : 'border-navy-200 text-navy-700'}`}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
            <button type="button" onClick={handleAddVehicle} disabled={!newGrnz.trim()} className="w-full rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white disabled:opacity-40">
              Добавить и выпустить карту
            </button>
          </div>
        )}

        <div className="space-y-3">
          {fleetVehicles.map((vehicle) => {
            const card = cards.find((c) => c.vehicleId === vehicle.id);
            const driver = vehicle.driverId ? allDrivers.find((d) => d.id === vehicle.driverId) : undefined;
            return (
              <div key={vehicle.id} className="rounded-xl border border-navy-100 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-navy-900">
                      {vehicle.grnz} · {CATEGORY_LABEL[vehicle.category]}
                    </p>
                    <p className="text-xs text-navy-400">{driver ? `Водитель: ${driver.fio}` : 'Водитель не назначен'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deactivateVehicle(vehicle.id, card?.id)}
                    aria-label="Деактивировать ТС"
                    className="text-navy-300 hover:text-status-blocked"
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
                    <button type="button" onClick={() => unassignDriver(vehicle.id, driver.id)} className="font-semibold text-navy-500">
                      Снять водителя
                    </button>
                  ) : (
                    <button type="button" onClick={() => setDriverFormFor(vehicle.id)} className="font-semibold text-navy-500">
                      Назначить водителя
                    </button>
                  )}
                </div>

                {driverFormFor === vehicle.id && (
                  <div className="mt-2 space-y-2 rounded-lg bg-navy-50 p-2">
                    <input value={driverFio} onChange={(e) => setDriverFio(e.target.value)} placeholder="ФИО водителя" className="w-full rounded-lg border border-navy-200 px-2 py-1.5 text-xs" />
                    <input value={driverIin} onChange={(e) => setDriverIin(e.target.value)} placeholder="ИИН водителя" className="w-full rounded-lg border border-navy-200 px-2 py-1.5 text-xs" />
                    <button type="button" onClick={() => handleAssignDriver(vehicle.id)} className="w-full rounded-lg bg-navy-600 py-1.5 text-xs font-semibold text-white">
                      Сохранить
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {fleetVehicles.length === 0 && <p className="text-sm text-navy-400">В автопарке нет активных ТС.</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => navigate('/cabinet/history')} className="flex-1 rounded-xl border border-navy-300 py-3 text-sm font-semibold text-navy-700">
          История заправок
        </button>
        <button type="button" onClick={handleExport} className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white">
          Скачать отчёт
        </button>
      </div>
    </div>
  );
}
