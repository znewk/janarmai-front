import type { AnomalyType, Case, CaseStatus } from '@/types/entities';
import { riskTierOf } from '@/lib/riskTier';
import { maskIdentifier } from '@/lib/mask';
import { mulberry32, randChoice, randInt, randRange } from '@/lib/seededRandom';
import { stationsSeed } from './stations.seed';
import { transactionsSeed } from './transactions.seed';

const CASES_SEED = 20260722;
const rng = mulberry32(CASES_SEED);

/** Якорь «сейчас» для демо-календаря — согласован с остальными seed-файлами (карты/транзакции датированы июлем 2026). */
const NOW = new Date('2026-07-23T12:00:00.000Z');

const ANOMALY_TYPES: AnomalyType[] = ['export_smuggling', 'limit_exceeded', 'frequent_shuttle', 'technical_failure'];

/**
 * Целевое распределение риск-баллов по 20 кейсам — намеренно не равномерное: 6 High / 8 Medium / 6 Low,
 * чтобы очередь кейсов выглядела как реальный рабочий поток, а не искусственный список (Analytics Deep Dive, разд. 5).
 */
const RISK_SCORE_BUCKETS: [number, number][] = [
  ...Array(6).fill([80, 99]),
  ...Array(8).fill([50, 79]),
  ...Array(6).fill([15, 49]),
];

const STATUS_CYCLE: CaseStatus[] = [
  'new', 'new', 'in_progress', 'new', 'closed',
  'in_progress', 'new', 'closed', 'in_progress', 'new',
  'closed', 'new', 'in_progress', 'new', 'closed',
  'in_progress', 'new', 'new', 'closed', 'in_progress',
];

function randomIdentifier(): string {
  return String(randInt(rng, 400000000000, 999999999999));
}

function buildReasonCodes(type: AnomalyType, station: (typeof stationsSeed)[number]): string[] {
  switch (type) {
    case 'export_smuggling': {
      const pct = randInt(rng, 140, 260);
      const days = randInt(rng, 3, 9);
      return [
        `Объём на ${pct}% выше среднего для категории ТС в приграничном регионе «${station.region}»`,
        `Повторные заправки одним и тем же лицом в разных АЗС региона за ${days} дн.`,
      ];
    }
    case 'limit_exceeded': {
      const pct = randInt(rng, 15, 90);
      const n = randInt(rng, 2, 5);
      return [
        `Превышение суточного лимита на ${pct}% без признаков перепродажи`,
        `${n}-я заправка сверх лимита за последние 7 дней по этой карте`,
      ];
    }
    case 'frequent_shuttle': {
      const n = randInt(rng, 3, 5);
      const minutes = randInt(rng, 25, 55);
      return [
        `${n} заправки за ${minutes} мин. в разных АЗС — интервал короче времени в пути между точками`,
        `Карта использована на ${n} разных АЗС в течение одного дня`,
      ];
    }
    case 'technical_failure':
    default: {
      const diffL = randInt(rng, 120, 980);
      return [
        `Расхождение чека ОФД и авторизации JanarmAI по объёму: ${diffL} л`,
        `Данные СНТ не поступили за отчётный период — разрыв в автоматической сверке`,
      ];
    }
  }
}

function buildAnalystNote(status: CaseStatus, type: AnomalyType): string {
  if (status === 'new') return '';
  if (status === 'closed') {
    return type === 'technical_failure'
      ? 'Проверено — техническая нестыковка источников данных, признаков мошенничества не выявлено. Кейс закрыт.'
      : 'Разобрано, направлено уведомление держателю карты. Повторных срабатываний не зафиксировано.';
  }
  return 'В работе — запрошены дополнительные данные по ОФД для сверки.';
}

function buildCase(index: number): Case {
  const [minScore, maxScore] = RISK_SCORE_BUCKETS[index];
  const riskScore = Math.round(randRange(rng, minScore, maxScore));
  const riskTier = riskTierOf(riskScore);
  const type = riskTier === 'high' ? randChoice(rng, ['export_smuggling', 'frequent_shuttle'] as const) : randChoice(rng, ANOMALY_TYPES);
  const station = randChoice(rng, stationsSeed);
  const daysAgo = randInt(rng, 0, 27);
  const dateTime = new Date(NOW.getTime() - daysAgo * 86_400_000 - randInt(rng, 0, 86_000_000)).toISOString();
  const status = STATUS_CYCLE[index];
  const relatedTransactionIds = transactionsSeed.filter((t) => t.stationId === station.id).map((t) => t.id);

  return {
    id: `case_${String(index + 1).padStart(3, '0')}`,
    riskScore,
    riskTier,
    dateTime,
    region: station.region,
    stationId: station.id,
    stationName: station.name,
    maskedId: maskIdentifier(randomIdentifier()),
    anomalyType: type,
    status,
    reasonCodes: buildReasonCodes(type, station),
    relatedTransactionIds,
    analystNote: buildAnalystNote(status, type),
  };
}

/**
 * Очередь кейсов — операционный слой аналитики (Analytics Deep Dive, разд. 3, 4.3): 20 записей
 * с разными риск-баллами и статусами (не только «новые») — демонстрирует живой рабочий процесс,
 * а не статичный список. Сортировка по риск-баллу — на UI (CasesQueuePage), не в самих данных.
 */
export const casesSeed: Case[] = RISK_SCORE_BUCKETS.map((_, i) => buildCase(i));
