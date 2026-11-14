import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { HomeEnergyCard } from '../../src/cards/energy-card';
import { HomePowerCard } from '../../src/cards/power-card';
import { HomeHouseCard } from '../../src/cards/house-card';
import { HomeOverviewCardEditor } from '../../src/editor';
import type { CardConfig, EnergyConfig, EntityState, HomeAssistant } from '../../src/types';
import '../../src/index';

afterEach(() => { document.body.replaceChildren(); });
const w = (state: string, unit = 'W'): EntityState => ({ state, attributes: { unit_of_measurement: unit } });
const config: EnergyConfig = { type: 'custom:home-energy-card', name: 'Office', icon: 'mdi:desk', palette: 'indigo', home_entity: 'sensor.home', devices: [{ entity: 'sensor.printer', name: '3D printer' }, { entity: 'sensor.desks', name: 'Office desks' }, { entity: 'sensor.tv', name: 'Television' }] };

it('renders the group total, share of home use and devices by draw', async () => {
  const card = new HomeEnergyCard(); card.setConfig(config);
  card.hass = { states: { 'sensor.home': w('1339'), 'sensor.printer': w('18'), 'sensor.desks': w('135') } };
  document.body.append(card); await card.updateComplete;
  await expect.element(page.getByText('153 W', { exact: true })).toBeVisible();
  await expect.element(page.getByText('1 unavailable')).toBeVisible();
  await expect.element(page.getByRole('progressbar', { name: 'Office: Share of home use' })).toHaveAttribute('aria-valuenow', '11');
  const names = [...card.shadowRoot!.querySelectorAll('.device-name')].map(node => node.textContent);
  expect(names).toEqual(['Office desks', '3D printer', 'Television']);
  expect(getComputedStyle(card).getPropertyValue('--hoc-bg')).toBe('#ecf0ff');
});

it('re-renders for its own devices only', async () => {
  const card = new HomeEnergyCard(); card.setConfig(config);
  const states: HomeAssistant['states'] = { 'sensor.home': w('1339'), 'sensor.printer': w('18'), 'sensor.desks': w('135'), 'light.elsewhere': { state: 'off', attributes: {} } };
  card.hass = { states }; document.body.append(card); await card.updateComplete;
  let renders = 0; const original = card['content'].bind(card); card['content'] = () => { renders++; return original(); };
  card.hass = { states: { ...states, 'light.elsewhere': { state: 'on', attributes: {} } } }; await card.updateComplete;
  expect(renders).toBe(0);
  card.hass = { states: { ...states, 'sensor.desks': w('200') } }; await card.updateComplete;
  expect(renders).toBe(1);
  await expect.element(page.getByText('218 W', { exact: true })).toBeVisible();
});

it('shows the unmetered remainder with the metered total', async () => {
  const card = new HomeEnergyCard(); card.setConfig({ ...config, name: 'Not metered', remainder: true });
  card.hass = { states: { 'sensor.home': w('1339'), 'sensor.printer': w('18'), 'sensor.desks': w('135'), 'sensor.tv': w('0') } };
  document.body.append(card); await card.updateComplete;
  await expect.element(page.getByText('1,186 W', { exact: true })).toBeVisible();
  await expect.element(page.getByText('Metered by plugs')).toBeVisible();
  await expect.element(page.getByText('153 W', { exact: true })).toBeVisible();
});

it('renders a power tile with a secondary reading and a scaled phase meter', async () => {
  const tile = new HomePowerCard(); tile.setConfig({ type: 'custom:home-power-card', name: 'Battery', entity: 'sensor.soc', secondary_entity: 'sensor.discharge', palette: 'teal' });
  const phases = new HomeHouseCard(); phases.setConfig({ type: 'custom:home-house-card', name: 'Phases', meters: [{ entity: 'sensor.l1', name: 'L1', max: 25 }, { entity: 'sensor.l2', name: 'L2', max: 25 }] });
  const hass = { states: { 'sensor.soc': w('21', '%'), 'sensor.discharge': w('0'), 'sensor.l1': w('0.3', 'A'), 'sensor.l2': w('4.6', 'A') } };
  tile.hass = hass; phases.hass = hass; document.body.append(tile, phases); await tile.updateComplete; await phases.updateComplete;
  await expect.element(page.getByText('21%', { exact: true })).toBeVisible();
  await expect.element(page.getByText('0 W', { exact: true })).toBeVisible();
  await expect.element(page.getByText('L1 0.3 A · L2 4.6 A')).toBeVisible();
  await expect.element(page.getByRole('progressbar', { name: 'L2' })).toHaveAttribute('aria-valuenow', '18.4');
});

it('edits the device list without dropping other options', async () => {
  const editor = new HomeOverviewCardEditor();
  editor.setConfig({ ...config, grid_options: { columns: 6 } } as CardConfig); document.body.append(editor); await editor.updateComplete;
  let result: EnergyConfig | undefined;
  editor.addEventListener('config-changed', event => { result = (event as CustomEvent).detail.config; });
  await page.getByRole('button', { name: 'Add device' }).click();
  expect(result?.devices).toHaveLength(4); expect(result?.devices[3]).toEqual({ entity: '' });
  await page.getByRole('button', { name: 'Remove device 1' }).click();
  expect(result?.devices.map(device => device.name)).toEqual(['Office desks', 'Television', undefined]);
  expect(result?.grid_options).toEqual({ columns: 6 }); expect(result?.home_entity).toBe('sensor.home');
});
