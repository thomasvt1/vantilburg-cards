import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { HomeEnergyCard } from '../../src/cards/energy-card';
import { HomePowerCard } from '../../src/cards/power-card';
import { HomeHouseCard } from '../../src/cards/house-card';
import { HomeRoomCard } from '../../src/cards/room-card';
import type { BaseCard } from '../../src/base-card';
import type { EnergyConfig, EntityState } from '../../src/types';
import '../../src/index';

afterEach(() => { document.body.replaceChildren(); });
const w = (state: string, unit = 'W'): EntityState => ({ state, attributes: { unit_of_measurement: unit } });
const group: EnergyConfig = { type: 'custom:home-energy-card', name: 'Office', home_entity: 'sensor.home', devices: [{ entity: 'sensor.printer', name: '3D printer' }, { entity: 'sensor.desks', name: 'Office desks' }, { entity: 'sensor.tv', name: 'Television' }, { entity: 'sensor.router', name: 'Router' }] };
const hass = { states: { 'sensor.home': w('1339'), 'sensor.printer': w('18'), 'sensor.desks': w('135'), 'sensor.router': w('9'), 'sensor.soc': w('21', '%'), 'sensor.discharge': w('-39'), 'sensor.l1': w('0.3', 'A'), 'sensor.l2': w('4.6', 'A'), 'sensor.temp': w('20', '°C') } };

async function mount(card: BaseCard) {
  const opened: string[] = [];
  card.addEventListener('hass-more-info', event => opened.push((event as CustomEvent).detail.entityId));
  card.hass = hass; document.body.append(card); await card.updateComplete;
  return opened;
}
const buttons = (card: BaseCard) => [...card.shadowRoot!.querySelectorAll('button')];

it('opens each device history from its row, but not from the computed total', async () => {
  const card = new HomeEnergyCard(); card.setConfig(group);
  const opened = await mount(card);
  await page.getByRole('button', { name: 'Office desks 135 W' }).click();
  await page.getByRole('button', { name: 'Television Unavailable' }).click();
  expect(opened).toEqual(['sensor.desks', 'sensor.tv']);
  expect(buttons(card)).toHaveLength(4);
  expect(card.shadowRoot!.querySelector('.total')!.closest('button')).toBeNull();
});

it('opens the primary and secondary power readings separately', async () => {
  const card = new HomePowerCard(); card.setConfig({ type: 'custom:home-power-card', name: 'Battery', entity: 'sensor.soc', secondary_entity: 'sensor.discharge' });
  const opened = await mount(card);
  await page.getByRole('button', { name: '21%' }).click();
  await page.getByRole('button', { name: '-39 W' }).click();
  expect(opened).toEqual(['sensor.soc', 'sensor.discharge']);
});

it('opens each house meter and a room temperature', async () => {
  const phases = new HomeHouseCard(); phases.setConfig({ type: 'custom:home-house-card', name: 'Phases', meters: [{ entity: 'sensor.l1', name: 'L1', max: 25 }, { entity: 'sensor.l2', name: 'L2', max: 25 }] });
  const room = new HomeRoomCard(); room.setConfig({ type: 'custom:home-room-card', name: 'Office', entity: 'sensor.temp' });
  const phasesOpened = await mount(phases), roomOpened = await mount(room);
  await expect.element(page.getByRole('button', { name: 'L1 0.3 A' })).toBeVisible();
  await page.getByRole('button', { name: 'L2 4.6 A' }).click();
  await page.getByRole('button', { name: '20.0°' }).click();
  expect(phasesOpened).toEqual(['sensor.l2']); expect(roomOpened).toEqual(['sensor.temp']);
});

it('keeps readings plain on cards with their own action and in the editor preview', async () => {
  const room = new HomeRoomCard(); room.setConfig({ type: 'custom:home-room-card', name: 'Office', entity: 'sensor.temp', tap_action: { action: 'navigate', navigation_path: '/lovelace/office' } });
  await mount(room);
  expect(buttons(room)).toHaveLength(1);
  const preview = new HomeEnergyCard(); preview.setConfig(group); preview.preview = true;
  await mount(preview);
  expect(buttons(preview)).toHaveLength(0);
  await expect.element(page.getByText('Office desks')).toBeVisible();
});

it('reports a masonry height that matches the rendered device list', async () => {
  const card = new HomeEnergyCard(); card.style.width = '360px';
  await mount(card);
  for (const [count, size] of [[1, 3], [2, 4], [4, 5]]) {
    card.setConfig({ ...group, devices: group.devices.slice(0, count) }); await card.updateComplete;
    expect(card.getCardSize()).toBe(size);
    expect(Math.abs(card.getBoundingClientRect().height - (105 + 30 * count))).toBeLessThan(6);
  }
  card.setConfig({ ...group, remainder: true }); expect(card.getCardSize()).toBe(3);
  const tile = new HomePowerCard(); tile.setConfig({ type: 'custom:home-power-card', entity: 'sensor.soc' }); expect(tile.getCardSize()).toBe(2);
});
