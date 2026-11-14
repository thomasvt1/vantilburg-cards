import { describe, expect, it } from 'vitest';
import { energyReading, formatWatts, meterReading, powerReading, watts } from '../../src/data';
import { validateConfig } from '../../src/config';
import type { EnergyConfig, EntityState, HomeAssistant, PowerConfig } from '../../src/types';

const w = (state: string, unit = 'W', extra: Record<string, unknown> = {}): EntityState => ({ state, attributes: { unit_of_measurement: unit, ...extra } });
const group: EnergyConfig = { type: 'custom:home-energy-card', name: 'Office', home_entity: 'sensor.home', devices: [{ entity: 'sensor.desk', name: 'Desks' }, { entity: 'sensor.printer' }, { entity: 'sensor.tv', name: 'Television' }] };

describe('power units', () => {
  it('converts W, kW and MW and rejects energy totals, unitless and missing values', () => {
    expect(watts(w('135'))).toBe(135);
    expect(watts(w('1.2', 'kW'))).toBe(1200);
    expect(watts(w('0.002', 'MW'))).toBe(2000);
    expect(watts(w('0'))).toBe(0);
    for (const entity of [w('12', 'kWh'), w('12', 'toString'), { state: '12', attributes: {} }, w('unavailable'), w(''), undefined]) expect(watts(entity)).toBeUndefined();
  });
  it('formats watts with grouping and switches to kW from 10 kW', () => {
    expect(formatWatts(1339, 'en')).toBe('1,339 W');
    expect(formatWatts(1339, 'nl')).toBe('1.339 W');
    expect(formatWatts(12345, 'en')).toBe('12.3 kW');
    expect(formatWatts(-240, 'en')).toBe('-240 W');
  });
});

describe('energy group', () => {
  const hass: HomeAssistant = { states: { 'sensor.home': w('1339'), 'sensor.desk': w('135'), 'sensor.printer': w('18', 'W', { friendly_name: '3D printer' }), 'sensor.tv': w('unavailable') } };
  it('sums available devices, sorts by draw and keeps unavailable devices explicit', () => {
    const r = energyReading(group, hass);
    expect(r.totalText).toBe('153 W');
    expect(r.rows.map(row => `${row.name} ${row.text}`)).toEqual(['Desks 135 W', '3D printer 18 W', 'Television Unavailable']);
    expect(r.subtitle).toBe('1 unavailable');
    expect(r.share).toBeCloseTo(11.43, 1);
  });
  it('reports active devices, standby and an all-unavailable group without inventing zero', () => {
    const states = { 'sensor.desk': w('135'), 'sensor.printer': w('2'), 'sensor.tv': w('0') };
    expect(energyReading(group, { states }).subtitle).toBe('1 active');
    expect(energyReading({ ...group, idle_threshold: 200 }, { states }).subtitle).toBe('Standby');
    const none = energyReading(group, { states: {} });
    expect(none.total).toBeUndefined(); expect(none.totalText).toBe('Unavailable'); expect(none.share).toBeUndefined();
  });
  it('keeps the configured order for equal readings', () => {
    const r = energyReading(group, { states: { 'sensor.desk': w('0'), 'sensor.printer': w('0'), 'sensor.tv': w('0') } });
    expect(r.rows.map(row => row.index)).toEqual([0, 1, 2]);
  });
  it('computes the unmetered remainder and never shows a negative remainder', () => {
    const remainder = { ...group, remainder: true };
    const r = energyReading(remainder, { states: { ...hass.states, 'sensor.tv': w('0') } });
    expect(r.totalText).toBe('1,186 W'); expect(r.meteredText).toBe('153 W'); expect(r.subtitle).toBe('Home use minus plugs');
    expect(energyReading(remainder, { states: { 'sensor.home': w('100'), 'sensor.desk': w('135') } }).total).toBe(0);
    expect(energyReading(remainder, { states: { 'sensor.desk': w('135') } }).total).toBeUndefined();
  });
  it('localizes labels', () => expect(energyReading({ ...group, language: 'nl' }, hass).subtitle).toBe('1 niet beschikbaar'));
});

describe('power tile', () => {
  const tile: PowerConfig = { type: 'custom:home-power-card', entity: 'sensor.battery', secondary_entity: 'sensor.discharge' };
  it('formats percentages, power and missing secondary readings', () => {
    expect(powerReading(tile, { states: { 'sensor.battery': w('21', '%'), 'sensor.discharge': w('0') } })).toEqual({ text: '21%', unavailable: false, secondary: '0 W' });
    expect(powerReading({ ...tile, precision: 1 }, { states: { 'sensor.battery': w('4.56', 'A') } })).toEqual({ text: '4.6 A', unavailable: false, secondary: 'Unavailable' });
    expect(powerReading({ ...tile, secondary_entity: undefined }, { states: {} })).toEqual({ text: 'Unavailable', unavailable: true, secondary: undefined });
  });
});

describe('scaled house meters', () => {
  it('shows the unit and sign, scales the magnitude against max and caps the bar at full', () => {
    const meter = { entity: 'sensor.l2', name: 'L2', max: 25 };
    expect(meterReading(meter, { states: { 'sensor.l2': w('4.6', 'A') } })).toMatchObject({ text: '4.6 A', value: 18.4 });
    expect(meterReading(meter, { states: { 'sensor.l2': w('30', 'A') } })).toMatchObject({ text: '30 A', value: 100 });
    expect(meterReading(meter, { states: { 'sensor.l2': w('4.6', 'A') } })).toMatchObject({ negative: false, limit: undefined });
    // The fuse limit applies in both directions: from 90% of max the meter is high, from max it is over.
    for (const [state, limit] of [['22.4', undefined], ['22.5', 'high'], ['-22.5', 'high'], ['25', 'over'], ['-25', 'over'], ['-31', 'over']] as const)
      expect(meterReading(meter, { states: { 'sensor.l2': w(state, 'A') } }).limit).toBe(limit);
    expect(meterReading({ entity: 'sensor.soc', name: 'Battery' }, { states: { 'sensor.soc': w('100', '%') } }).limit).toBeUndefined();
    expect(meterReading(meter, { states: { 'sensor.l2': w('-0.373', 'A') } })).toMatchObject({ text: '-0.4 A', value: 1.492, negative: true });
    expect(meterReading(meter, { states: { 'sensor.l2': w('-30', 'A') } })).toMatchObject({ text: '-30 A', value: 100 });
    expect(meterReading(meter, { states: { 'sensor.l2': w('unavailable', 'A') } })).toMatchObject({ text: '—', value: undefined });
    expect(meterReading({ entity: 'sensor.soc', name: 'Battery' }, { states: { 'sensor.soc': w('-5', '%') } })).toMatchObject({ text: '—', value: undefined });
  });
});

describe('validation', () => {
  it('rejects invalid energy and power configs', () => {
    expect(() => validateConfig({ ...group, devices: [] })).toThrow('1 to 30');
    expect(() => validateConfig({ ...group, devices: [{ entity: 'not an id' }] })).toThrow('devices.entity');
    expect(() => validateConfig({ ...group, home_entity: undefined, remainder: true })).toThrow('home consumption');
    expect(() => validateConfig({ ...group, idle_threshold: -1 })).toThrow('idle_threshold');
    expect(() => validateConfig({ ...group, tap_action: { action: 'more-info' } })).toThrow('tap_action.entity');
    expect(() => validateConfig({ type: 'custom:home-power-card', entity: 'sensor.a', precision: 5 })).toThrow('precision');
    expect(() => validateConfig({ type: 'custom:home-house-card', meters: [{ entity: 'sensor.l1', name: 'L1', max: 0 }] })).toThrow('max');
    expect(() => validateConfig({ type: 'custom:home-house-card', meters: [{ entity: 'sensor.l1', name: 'L1', max: 25, negative_palette: 'red' as never }] })).toThrow('negative_palette');
    expect(() => validateConfig(group)).not.toThrow();
  });
});
