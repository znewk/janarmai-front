import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, LogOut, RotateCcw, Trash2, X } from 'lucide-react';
import type { VehicleCategory } from '@/types/entities';
import { LimitProgressBar } from '@/components/ui/LimitProgressBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        <Button type="button" onClick={() => navigate('/')} className="mt-4">
          На главную
        </Button>
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
        <Card className="flex-row items-start">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-ok" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">Карты успешно выпущены</p>
            <p className="text-xs text-gray-500">По каждому ТС автопарка выпущена отдельная карта — остаток лимита виден ниже.</p>
          </div>
          <button type="button" onClick={() => setShowIssuedBanner(false)} aria-label="Закрыть" className="text-gray-300 hover:text-gray-500">
            <X className="h-4 w-4" />
          </button>
        </Card>
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
        <Button type="button" variant="outline" size="sm" onClick={handleLogout} className="shrink-0 rounded-full">
          <LogOut className="h-3.5 w-3.5" />
          Выйти
        </Button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Автопарк</h2>
          <Button type="button" variant="link" size="sm" onClick={() => setShowAddVehicle((v) => !v)} className="h-auto p-0 text-orange-600">
            + Добавить ТС
          </Button>
        </div>

        {showAddVehicle && (
          <Card className="mb-3">
            <Input value={newGrnz} onChange={(e) => setNewGrnz(e.target.value)} placeholder="ГРНЗ" />
            <div className="flex gap-2">
              {(['passenger', 'truck'] as VehicleCategory[]).map((c) => (
                <Button key={c} type="button" variant={newCategory === c ? 'default' : 'outline'} onClick={() => setNewCategory(c)} className="flex-1 rounded-xl">
                  {CATEGORY_LABEL[c]}
                </Button>
              ))}
            </div>
            <Button type="button" onClick={handleAddVehicle} disabled={!newGrnz.trim()} className="w-full">
              Добавить и выпустить карту
            </Button>
          </Card>
        )}

        <div className="space-y-3">
          {fleetVehicles.map((vehicle) => {
            const card = cards.find((c) => c.vehicleId === vehicle.id);
            const driver = vehicle.driverId ? allDrivers.find((d) => d.id === vehicle.driverId) : undefined;
            return (
              <Card key={vehicle.id}>
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

                {card && <LimitProgressBar usedL={card.usedTodayL} limitL={card.dailyLimitL} bare />}

                <div className="flex gap-2 text-xs">
                  {driver ? (
                    <Button type="button" variant="link" size="sm" onClick={() => unassignDriver(vehicle.id, driver.id)} className="h-auto p-0 text-gray-500">
                      Снять водителя
                    </Button>
                  ) : (
                    <Button type="button" variant="link" size="sm" onClick={() => setDriverFormFor(vehicle.id)} className="h-auto p-0 text-gray-500">
                      Назначить водителя
                    </Button>
                  )}
                </div>

                {driverFormFor === vehicle.id && (
                  <div className="space-y-2 rounded-xl bg-gray-50 p-2">
                    <Input value={driverFio} onChange={(e) => setDriverFio(e.target.value)} placeholder="ФИО водителя" className="h-9 bg-white text-xs" />
                    <Input value={driverIin} onChange={(e) => setDriverIin(e.target.value)} placeholder="ИИН водителя" className="h-9 bg-white text-xs" />
                    <Button type="button" size="sm" onClick={() => handleAssignDriver(vehicle.id)} className="w-full">
                      Сохранить
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
          {fleetVehicles.length === 0 && <p className="text-sm text-gray-400">В автопарке нет активных ТС.</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => navigate('/cabinet/history')} className="flex-1">
          История заправок
        </Button>
        <Button type="button" onClick={handleExport} className="flex-1">
          Скачать отчёт
        </Button>
      </div>

      <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="w-full text-gray-400">
        <RotateCcw className="h-3.5 w-3.5" />
        Сбросить демо-данные
      </Button>
    </div>
  );
}
