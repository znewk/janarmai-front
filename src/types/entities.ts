/** Модель данных мок-сущностей (тех.план раздел 7). */

export type UserType = 'fl';
export type Residency = 'resident' | 'nonresident';
export type Channel = 'egov' | 'bvu' | 'kmg';
export type VehicleCategory = 'passenger' | 'truck';

export interface User {
  id: string;
  type: UserType;
  residency: Residency;
  fio: string;
  phone: string;
  channel: Channel;
  /** ИИН — только для резидента. */
  iin?: string;
  /** Номер паспорта — только для иностранца (4.3). */
  passportNumber?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  residency: Residency;
  name: string;
  /** БИН — только для резидента (4.4). */
  bin?: string;
  /** Регистрационный номер — только для нерезидента (4.5), без проверки в ГБД ЮЛ. */
  registrationNumber?: string;
  /** Директор/представитель — верифицируется как ФЛ (резидент по ГБД ФЛ или иностранец по «Беркут»). */
  directorId: string;
  phone: string;
  channel: Extract<Channel, 'kmg'>;
  createdAt: string;
}

export interface Driver {
  id: string;
  companyId: string;
  iin: string;
  fio: string;
  active: boolean;
}

export interface Vehicle {
  id: string;
  ownerKind: 'user' | 'company';
  ownerId: string;
  grnz: string;
  category: VehicleCategory;
  driverId?: string;
  active: boolean;
}

export type CardType = 'fl_person' | 'fl_passenger' | 'fl_truck' | 'ul_passenger' | 'ul_truck';

export interface Card {
  id: string;
  cardType: CardType;
  ownerKind: 'user' | 'vehicle';
  userId?: string;
  vehicleId?: string;
  /** Маскированный ИИН/БИН для отображения на карточке (8.2). */
  maskedIdentifier: string;
  /** null — льготный лимит не применяется (иностранец / ЮЛ-нерезидент), обслуживание по предельной цене без потолка. */
  dailyLimitL: number | null;
  usedTodayL: number;
  /** Признак применимости льготной цены к владельцу карты. */
  priceEligible: boolean;
  resetAt: string;
  qrToken: string;
  qrUpdatedAt: string;
  active: boolean;
}

export type FuelType = 'ai92' | 'ai95' | 'dt';
export type PriceType = 'preferential' | 'market';

export interface Transaction {
  id: string;
  cardId: string;
  dateTime: string;
  fuelType: FuelType;
  volumeL: number;
  stationId: string;
  stationName: string;
  priceType: PriceType;
  pricePerLiterKzt: number;
  totalKzt: number;
}

export interface Station {
  id: string;
  name: string;
  network: string;
  region: string;
  isBorderRegion: boolean;
}

export type AdminRole = 'kmg' | 'minenergo' | 'akimat';

export interface AdminUser {
  id: string;
  login: string;
  /** Мок-пароль в открытом виде — демонстрационный слой без реального бэкенда. */
  password: string;
  fio: string;
  role: AdminRole;
}

/** Риск-тир по риск-баллу 0–100 — единая шкала для кейсов, регионов и сетей АЗС (Analytics Deep Dive, разд. 2.2). */
export type RiskTier = 'high' | 'medium' | 'low';

/**
 * Таксономия аномалий по образцу SGS Fuel Integrity Programs (Analytics Deep Dive, разд. 2.1/4.2) —
 * заменяет бинарный статус «Легально/Блокировка» из исходного ТЗ 8.5.
 */
export type AnomalyType = 'export_smuggling' | 'limit_exceeded' | 'frequent_shuttle' | 'technical_failure';

export type CaseStatus = 'new' | 'in_progress' | 'closed';

/**
 * Операционный слой аналитики (Analytics Deep Dive, разд. 3, 4.3) — конкретный случай для разбора
 * аналитиком, а не агрегат. `status`/`analystNote` мутируемы через `case.store.ts` (мок, без бэкенда).
 */
export interface Case {
  id: string;
  riskScore: number;
  riskTier: RiskTier;
  dateTime: string;
  region: string;
  stationId: string;
  stationName: string;
  /** Маскированный ИИН/БИН держателя карты, по которой сработал алерт. */
  maskedId: string;
  anomalyType: AnomalyType;
  status: CaseStatus;
  /** Конкретные причины срабатывания алерта — напр. «3 заправки за 40 минут в разных АЗС». */
  reasonCodes: string[];
  /** Связанные транзакции — id из `Transaction` (могут быть пустыми, если кейс не привязан к seed-истории). */
  relatedTransactionIds: string[];
  /** Заметка аналитика — мок-поле, редактируется на `CaseDetailPage`, без сохранения на бэкенд. */
  analystNote: string;
}
