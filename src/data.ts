import type { EnergyConfig, EntityState, HomeAssistant, MeterConfig, PowerConfig, RoomConfig, WasteConfig } from './types';

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
  en: { unavailable: 'Unavailable', room: 'Room', house: 'House', waste: 'Trash collection', today: 'Collection today', tomorrow: 'Collection tomorrow', inDays: (n: number) => `Collection in ${n} days`, scheduleUnavailable: 'Schedule unavailable', binOut: 'Bin put out', viewSchedule: 'View schedule', lights: (n: number) => `${n} ${n === 1 ? 'light' : 'lights'} on`, missing: (n: number) => `${n} unavailable`, energy: 'Energy', power: 'Power', active: (n: number) => `${n} active`, standby: 'Standby', notMetered: 'Home use minus plugs', metered: 'Metered by plugs', share: 'Share of home use' },
  nl: { unavailable: 'Niet beschikbaar', room: 'Kamer', house: 'Huis', waste: 'Afvalinzameling', today: 'Vandaag ophalen', tomorrow: 'Morgen ophalen', inDays: (n: number) => `Ophalen over ${n} dagen`, scheduleUnavailable: 'Planning niet beschikbaar', binOut: 'Container buiten', viewSchedule: 'Bekijk planning', lights: (n: number) => `${n} ${n === 1 ? 'lamp' : 'lampen'} aan`, missing: (n: number) => `${n} niet beschikbaar`, energy: 'Energie', power: 'Vermogen', active: (n: number) => `${n} actief`, standby: 'Stand-by', notMetered: 'Thuisverbruik min stekkers', metered: 'Gemeten door stekkers', share: 'Aandeel van thuisverbruik' },
};

export function roomReading(config: RoomConfig, hass: HomeAssistant) {
  const lang = language(hass, config.language), t = words[lang];
  const mode = config.display === 'lights' || (config.display !== 'temperature' && !config.entity) ? 'lights' : 'temperature';
  if (mode === 'lights') {
    const ids = [...new Set(config.lights || [])];
    const states = ids.map(id => hass.states[id]);
    const known = states.filter(e => e && ['on', 'off'].includes(e.state));
    const on = known.filter(e => e?.state === 'on').length;
    return { mode, text: !known.length ? t.unavailable : t.lights(on), unavailable: !known.length };
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
  if (config.max !== undefined) {
    // A scaled meter (for example phase current against its fuse) may exceed max; the bar stops at full.
    const reading = value !== undefined && value >= 0 ? value : undefined;
    const unit = entity?.attributes.unit_of_measurement;
    const lang = language(hass);
    const text = reading === undefined ? '—' : new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(reading) + (typeof unit === 'string' && unit ? ` ${unit}` : '');
    return { name: config.name, value: reading === undefined ? undefined : Math.min(100, (reading / config.max) * 100), text };
  }
  // A percentage outside its valid range is not a real charge reading.
  const percentage = value !== undefined && value >= 0 && value <= 100 ? value : undefined;
  return { name: config.name, value: percentage, text: percentage === undefined ? '—' : `${Math.round(percentage)}%` };
}

const powerScale: Record<string, number> = { W: 1, kW: 1000, MW: 1_000_000 };
/** Power in watts from a W/kW/MW sensor; undefined for missing, unitless or non-power readings such as kWh totals. */
export function watts(entity: EntityState | undefined): number | undefined {
  if (!available(entity)) return;
  const unit = entity.attributes.unit_of_measurement;
  const scale = typeof unit === 'string' && Object.hasOwn(powerScale, unit) ? powerScale[unit] : undefined;
  const n = numeric(entity.state);
  return scale === undefined || n === undefined ? undefined : n * scale;
}
export function formatWatts(value: number, lang: 'en' | 'nl') {
  return Math.abs(value) >= 10_000
    ? `${new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(value / 1000)} kW`
    : `${new Intl.NumberFormat(lang, { maximumFractionDigits: 0 }).format(value)} W`;
}

export function energyReading(config: EnergyConfig, hass: HomeAssistant) {
  const lang = language(hass, config.language), t = words[lang];
  const threshold = config.idle_threshold ?? 5;
  const rows = config.devices.map((device, index) => {
    const entity = hass.states[device.entity];
    const value = watts(entity);
    const friendly = entity?.attributes.friendly_name;
    return { index, name: device.name || (typeof friendly === 'string' && friendly ? friendly : device.entity), value, idle: value === undefined || value < threshold, text: value === undefined ? t.unavailable : formatWatts(value, lang) };
  });
  const measured = rows.filter(r => r.value !== undefined);
  const metered = measured.length ? measured.reduce((sum, r) => sum + r.value!, 0) : undefined;
  const home = config.home_entity ? watts(hass.states[config.home_entity]) : undefined;
  // Plug and meter samples arrive at different moments, so a remainder can briefly dip below zero.
  const total = config.remainder ? (home === undefined || metered === undefined ? undefined : Math.max(0, home - metered)) : metered;
  const share = total !== undefined && home !== undefined && home > 0 ? Math.min(100, Math.max(0, (total / home) * 100)) : undefined;
  const missing = rows.length - measured.length, active = rows.filter(r => !r.idle).length;
  const subtitle = config.remainder ? t.notMetered : missing ? t.missing(missing) : active ? t.active(active) : t.standby;
  // Largest draw first; unavailable devices last, otherwise in configured order.
  const sorted = [...rows].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity) || a.index - b.index);
  return { rows: sorted, total, totalText: total === undefined ? t.unavailable : formatWatts(total, lang), metered, meteredText: metered === undefined ? t.unavailable : formatWatts(metered, lang), share, subtitle };
}

export function powerReading(config: PowerConfig, hass: HomeAssistant) {
  const lang = language(hass, config.language), t = words[lang];
  const format = (id: string | undefined) => {
    if (!id) return undefined;
    const entity = hass.states[id];
    const w = watts(entity);
    if (w !== undefined) return formatWatts(w, lang);
    const n = available(entity) ? numeric(entity.state) : undefined;
    if (n === undefined) return t.unavailable;
    const unit = entity!.attributes.unit_of_measurement;
    const number = new Intl.NumberFormat(lang, { maximumFractionDigits: config.precision ?? 0, minimumFractionDigits: config.precision ?? 0 }).format(n);
    return typeof unit === 'string' && unit ? (unit === '%' ? `${number}%` : `${number} ${unit}`) : number;
  };
  const text = format(config.entity)!;
  return { text, unavailable: text === t.unavailable, secondary: format(config.secondary_entity) };
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
