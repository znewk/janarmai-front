import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ListChecks } from 'lucide-react';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ANOMALY_TYPE_DESCRIPTION, ANOMALY_TYPE_LABEL, CASE_STATUS_LABEL } from '@/lib/riskTier';
import { FUEL_TYPE_LABEL } from '@/mocks/seed';
import { useCaseStore } from '@/store/case.store';
import { useTransactionStore } from '@/store/transaction.store';
import type { CaseStatus } from '@/types/entities';

const STATUS_OPTIONS: CaseStatus[] = ['new', 'in_progress', 'closed'];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * A-08 — карточка кейса (drill-down по клику из A-07/дашборда): reason codes, связанные
 * транзакции, поле заметки аналитика (Analytics Deep Dive 4.3) — мок, без сохранения на бэкенд
 * (персистится в браузере через `case.store.ts`, как и всё остальное состояние демо).
 */
export function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cases = useCaseStore((s) => s.cases);
  const updateStatus = useCaseStore((s) => s.updateStatus);
  const updateNote = useCaseStore((s) => s.updateNote);
  const transactions = useTransactionStore((s) => s.transactions);

  const activeCase = cases.find((c) => c.id === id);
  const [noteDraft, setNoteDraft] = useState(activeCase?.analystNote ?? '');
  const [savedTick, setSavedTick] = useState(0);

  if (!activeCase) {
    return (
      <div className="p-8">
        <p className="text-sm text-status-blocked">Кейс не найден.</p>
        <Button type="button" variant="link" onClick={() => navigate('/admin/cases')} className="mt-2 h-auto p-0">
          ← К очереди кейсов
        </Button>
      </div>
    );
  }

  const relatedTransactions = transactions.filter((t) => activeCase.relatedTransactionIds.includes(t.id));

  const handleSaveNote = () => {
    updateNote(activeCase.id, noteDraft);
    setSavedTick((t) => t + 1);
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon" onClick={() => navigate('/admin/cases')} aria-label="К очереди кейсов">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-xs text-navy-400">A-08 · Кейс {activeCase.id}</p>
          <h1 className="text-xl font-bold text-navy-900">{ANOMALY_TYPE_LABEL[activeCase.anomalyType]}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <RiskBadge tier={activeCase.riskTier} score={activeCase.riskScore} />
                <span className="text-sm text-navy-500">{formatDateTime(activeCase.dateTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-navy-700">
                <span className="text-navy-400">{activeCase.region}</span>
                <span>·</span>
                <span>{activeCase.stationName}</span>
                <span>·</span>
                <span className="tabular-nums text-navy-500">{activeCase.maskedId}</span>
              </div>
            </div>
            <p className="text-sm text-navy-500">{ANOMALY_TYPE_DESCRIPTION[activeCase.anomalyType]}</p>

            <div className="border-t border-gray-100 pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-navy-400 uppercase">
                <ListChecks className="h-3.5 w-3.5" />
                Reason codes — почему сработал алерт
              </p>
              <ul className="space-y-1.5">
                {activeCase.reasonCodes.map((code) => (
                  <li key={code} className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700">
                    {code}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Связанные транзакции ({relatedTransactions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {relatedTransactions.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {relatedTransactions.map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <p className="text-navy-700">{t.stationName}</p>
                        <p className="text-xs tabular-nums text-navy-400">{formatDateTime(t.dateTime)}</p>
                      </div>
                      <div className="text-right">
                        <p className="tabular-nums text-navy-700">
                          {t.volumeL} л · {FUEL_TYPE_LABEL[t.fuelType]}
                        </p>
                        <p className="text-xs tabular-nums text-navy-400">{t.totalKzt.toLocaleString('ru-RU')} ₸</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-navy-400">Для этого кейса нет привязанных транзакций в демо-истории.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Статус</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              {STATUS_OPTIONS.map((s) => (
                <Button key={s} type="button" size="sm" variant={activeCase.status === s ? 'default' : 'outline'} onClick={() => updateStatus(activeCase.id, s)} className="flex-1">
                  {CASE_STATUS_LABEL[s]}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Заметка аналитика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={6}
                placeholder="Например: запрошены данные по ОФД, ожидаем ответ до..."
              />
              <Button type="button" onClick={handleSaveNote} className="w-full">
                Сохранить заметку
              </Button>
              {savedTick > 0 && (
                <Badge variant="success" className="w-full justify-center py-1.5">
                  Сохранено (только в этом браузере — мок без бэкенда)
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
