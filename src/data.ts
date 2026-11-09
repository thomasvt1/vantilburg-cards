import type { EntityState, HomeAssistant, MeterConfig, RoomConfig, WasteConfig } from './types';

export const available = (entity: EntityState | undefined): entity is EntityState =>
  !!entity && !['unknown', 'unavailable', ''].includes(entity.state.trim().toLowerCase());

export function numeric(value: unknown): number | undefined {
  if ((typeof value !== 'string' && typeof value !== 'number') || (typeof value === 'string' && !value.trim())) return;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function language(hass: HomeAssistant, override?: string): 'en' | 'nl' {
  return (override && override !== 'auto' ? override : hass.locale?.language || hass.language || 'en').startsWith('nl') ? 'nl' : 'en';
}
export const words = {
  en: { unavailable: 'Unavailable', room: 'Room', house: 'House', waste: 'Trash collection', today: 'Collection today', tomorrow: 'Collection tomorrow', inDays: (n: number) => `Collection in ${n} days`, scheduleUnavailable: 'Schedule unavailable', binOut: 'Bin put out', viewSchedule: 'View schedule', lights: (n: number) => `${n} ${n === 1 ? 'light' : 'lights'} on`, missing: (n: number) => `${n} unavailable` },
  nl: { unavailable: 'Niet beschikbaar', room: 'Kamer', house: 'Huis', waste: 'Afvalinzameling', today: 'Vandaag ophalen', tomorrow: 'Morgen ophalen', inDays: (n: number) => `Ophalen over ${n} dagen`, scheduleUnavailable: 'Planning niet beschikbaar', binOut: 'Container buiten', viewSchedule: 'Bekijk planning', lights: (n: number) => `${n} ${n === 1 ? 'lamp' : 'lampen'} aan`, missing: (n: number) => `${n} niet beschikbaar` },
};

export function roomReading(config: RoomConfig, hass: HomeAssistant) {
  const lang = language(hass, config.language), t = words[lang];
  const mode = config.display === 'lights' || (config.display !== 'temperature' && !config.entity) ? 'lights' : 'temperature';
  if (mode === 'lights') {
    const ids = [...new Set(config.lights || [])];
    const states = ids.map(id => hass.states[id]);
    const known = states.filter(e => e && ['on', 'off'].includes(e.state));
    const missing = states.length - known.length;
    const on = known.filter(e => e?.state === 'on').length;
    return { mode, text: !known.length ? t.unavailable : t.lights(on) + (missing ? ` · ${t.missing(missing)}` : ''), unavailable: !known.length };
  }
  const entity = hass.states[config.entity!];
  const attribute = config.attribute ?? (config.entity?.startsWith('climate.') ? 'current_temperature' : undefined);
  const n = available(entity) ? numeric(attribute ? entity.attributes[attribute] : entity.state) : undefined;
  const unit = entity?.attributes.unit_of_measurement ?? hass.config?.unit_system?.temperature ?? '°C';
  const suffix = unit === '°C' ? '°' : String(unit);
  return { mode, text: n === undefined ? t.unavailable : new Intl.NumberFormat(lang, { minimumFractionDigits: config.precision ?? 1, maximumFractionDigits: config.precision ?? 1 }).format(n) + suffix, unavailable: n === undefined };
}

export function meterReading(config: MeterConfig, hass: HomeAssistant) {
  const entity = hass.states[config.entity];
  const value = available(entity) ? numeric(entity.state) : undefined;
  // A percentage outside its valid range is not a real charge reading.
  const percentage = value !== undefined && value >= 0 && value <= 100 ? value : undefined;
  return { name: config.name, value: percentage, text: percentage === undefined ? '—' : `${Math.round(percentage)}%` };
}

const wasteNames: Record<'en' | 'nl', Record<string, string>> = {
  en: { pmd: 'PMD', gft: 'Organic waste', papier: 'Paper', restafval: 'Residual waste' },
  nl: { pmd: 'PMD', gft: 'GFT', papier: 'Papier', restafval: 'Restafval' },
};
export function wasteReading(config: WasteConfig, hass: HomeAssistant) {
  const lang = language(hass, config.language), t = words[lang];
  const entity = hass.states[config.entity];
  const n = available(entity) ? numeric(entity.state) : undefined;
  const days = n !== undefined && Number.isInteger(n) && n >= 0 ? n : undefined;
  const title = config.name || (days === undefined ? t.waste : days === 0 ? t.today : days === 1 ? t.tomorrow : t.inDays(days));
  const type = config.type_entity ? hass.states[config.type_entity] : undefined;
  const key = available(type) ? type.state.trim().toLowerCase() : undefined;
  const typeLabel = key ? config.type_names?.[key] || wasteNames[lang][key] || type!.state : undefined;
  const moved = config.moved_entity && hass.states[config.moved_entity]?.state === 'on';
  const parts = [days === undefined ? t.scheduleUnavailable : typeLabel, moved ? t.binOut : undefined, config.popup || config.tap_action?.action === 'navigate' ? t.viewSchedule : undefined].filter(Boolean);
  return { title, text: parts.join(' · ') || t.waste, days };
}
