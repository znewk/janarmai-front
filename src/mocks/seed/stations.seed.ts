import type { Station } from '@/types/entities';

/**
 * Мок-список АЗС по областям РК. isBorderRegion — регионы, граничащие с РФ
 * (акцент ТЗ 1: дефицит бензина в приграничных с РК регионах России → мониторинг вывоза).
 */
export const stationsSeed: Station[] = [
  { id: 'st_01', name: 'КМГ АЗС №14', network: 'КМГ АЗС', region: 'Западно-Казахстанская', isBorderRegion: true },
  { id: 'st_02', name: 'КМГ АЗС №22', network: 'КМГ АЗС', region: 'Костанайская', isBorderRegion: true },
  { id: 'st_03', name: 'Sinooil №5', network: 'Sinooil', region: 'Северо-Казахстанская', isBorderRegion: true },
  { id: 'st_04', name: 'Гелиос №8', network: 'Гелиос', region: 'Павлодарская', isBorderRegion: true },
  { id: 'st_05', name: 'КМГ АЗС №31', network: 'КМГ АЗС', region: 'Актюбинская', isBorderRegion: true },
  { id: 'st_06', name: 'Sinooil №12', network: 'Sinooil', region: 'Восточно-Казахстанская', isBorderRegion: true },
  { id: 'st_07', name: 'КМГ АЗС №02', network: 'КМГ АЗС', region: 'Астана', isBorderRegion: false },
  { id: 'st_08', name: 'Гелиос №1', network: 'Гелиос', region: 'Алматы', isBorderRegion: false },
  { id: 'st_09', name: 'Sinooil №19', network: 'Sinooil', region: 'Алматинская', isBorderRegion: false },
  { id: 'st_10', name: 'КМГ АЗС №45', network: 'КМГ АЗС', region: 'Карагандинская', isBorderRegion: false },
  { id: 'st_11', name: 'Гелиос №6', network: 'Гелиос', region: 'Туркестанская', isBorderRegion: false },
  { id: 'st_12', name: 'КМГ АЗС №09', network: 'КМГ АЗС', region: 'Мангистауская', isBorderRegion: false },
  { id: 'st_13', name: 'Sinooil №3', network: 'Sinooil', region: 'Атырауская', isBorderRegion: true },
  { id: 'st_14', name: 'КМГ АЗС №17', network: 'КМГ АЗС', region: 'Жамбылская', isBorderRegion: false },
  { id: 'st_15', name: 'Гелиос №11', network: 'Гелиос', region: 'Шымкент', isBorderRegion: false },
];
