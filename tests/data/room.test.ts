import { describe, expect, it } from 'vitest';
import { roomReading, numeric } from '../../src/data';
import { validateConfig } from '../../src/config';
import type { HomeAssistant, RoomConfig } from '../../src/types';
const config: RoomConfig = { type: 'custom:home-room-card', entity: 'climate.room' };
const hass: HomeAssistant = { states: { 'climate.room': { state: 'heat', attributes: { current_temperature: 20.1 } } } };
describe('room data', () => {
  it('uses climate current temperature and preserves zero', () => {
    expect(roomReading(config, hass).text).toBe('20.1°');
    expect(roomReading(config, { states: { 'climate.room': { state: 'off', attributes: { current_temperature: 0 } } } }).text).toBe('0.0°');
  });
  it('never turns missing, empty, null or non-finite values into zero', () => {
    for (const value of [undefined, null, '', ' ', 'unknown', Infinity, NaN, true]) expect(numeric(value)).toBeUndefined();
    expect(roomReading(config, { states: {} }).text).toBe('Unavailable');
    expect(roomReading(config, { states: { 'climate.room': { state: 'unavailable', attributes: { current_temperature: 20 } } } }).text).toBe('Unavailable');
  });
  it('supports temperature sensors and Fahrenheit', () => {
    expect(roomReading({ ...config, entity: 'sensor.temp' }, { states: { 'sensor.temp': { state: '68.5', attributes: { unit_of_measurement: '°F' } } } }).text).toBe('68.5°F');
  });
  it('counts unique lights and distinguishes unavailable from off', () => {
    const lights: RoomConfig = { type: 'custom:home-room-card', lights: ['light.a', 'light.a', 'light.b'] };
    expect(roomReading(lights, { states: { 'light.a': { state: 'on', attributes: {} } } }).text).toBe('1 light on · 1 unavailable');
    expect(roomReading(lights, { states: {} }).text).toBe('Unavailable');
  });
  it('localizes numbers and labels', () => expect(roomReading({ ...config, language: 'nl' }, hass).text).toBe('20,1°'));
  it('rejects invalid configs and external navigation', () => {
    expect(() => validateConfig({ type: 'custom:home-room-card' })).toThrow('Select at least one light');
    expect(() => validateConfig({ ...config, precision: 12 })).toThrow('precision');
    expect(() => validateConfig({ ...config, tap_action: { action: 'navigate', navigation_path: '//example.com' } })).toThrow('local path');
  });
});
