import { expect, it } from 'vitest';
import { meterReading, wasteReading } from '../../src/data';
import { validateConfig } from '../../src/config';
import type { WasteConfig } from '../../src/types';
const waste: WasteConfig = { type: 'custom:home-waste-card', entity: 'sensor.days', type_entity: 'sensor.waste', moved_entity: 'input_boolean.bin' };
it('preserves 0% and 100% and rejects invalid percentages', () => {
  for (const value of ['0', '100', '-1', '101', 'unknown', 'unavailable', '']) {
    const r = meterReading({ entity: 'sensor.charge', name: 'Battery' }, { states: { 'sensor.charge': { state: value, attributes: {} } } });
    expect(r.text).toBe(['0', '100'].includes(value) ? `${value}%` : '—');
  }
});
it('renders today, tomorrow and future collection dates', () => {
  for (const [state, title] of [['0', 'Collection today'], ['1', 'Collection tomorrow'], ['3', 'Collection in 3 days']]) {
    expect(wasteReading(waste, { states: { 'sensor.days': { state, attributes: {} } } }).title).toBe(title);
  }
});
it('shows an unavailable schedule for missing, negative and fractional days', () => {
  for (const state of ['unknown', '', '-1', '1.5', 'Infinity']) {
    const r = wasteReading(waste, { states: { 'sensor.days': { state, attributes: {} } } });
    expect(r.title).toBe('Trash collection'); expect(r.text).toBe('Schedule unavailable');
  }
});
it('combines waste type, bin status and schedule link without HTML injection', () => {
  const r = wasteReading({ ...waste, tap_action: { action: 'navigate', navigation_path: '#waste' }, type_names: { pmd: '<b>Packaging</b>' } }, { states: { 'sensor.days': { state: '3', attributes: {} }, 'sensor.waste': { state: 'PMD', attributes: {} }, 'input_boolean.bin': { state: 'on', attributes: {} } } });
  expect(r.text).toBe('<b>Packaging</b> · Bin put out · View schedule');
});
it('localizes waste dates', () => expect(wasteReading({ ...waste, language: 'nl' }, { states: { 'sensor.days': { state: '1', attributes: {} } } }).title).toBe('Morgen ophalen'));
it('validates meter lists and popup structure', () => {
  expect(() => validateConfig({ type: 'custom:home-house-card', meters: [] })).toThrow('1 to 6');
  expect(() => validateConfig({ ...waste, popup: { hash: 'no-hash', sections: [] } })).toThrow('popup.hash');
  expect(() => validateConfig({ ...waste, tap_action: { action: 'navigate', navigation_path: '#waste' }, popup: { hash: '#waste', sections: [] } })).toThrow('not both');
});
