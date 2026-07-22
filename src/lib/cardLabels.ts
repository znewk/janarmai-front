import type { Card } from '@/types/entities';

export const CARD_TYPE_LABEL: Record<Card['cardType'], string> = {
  fl_person: 'ФЛ · персональная',
  fl_passenger: 'ФЛ · легковая',
  fl_truck: 'ФЛ · грузовая',
  ul_passenger: 'ЮЛ · легковая',
  ul_truck: 'ЮЛ · грузовая',
};
