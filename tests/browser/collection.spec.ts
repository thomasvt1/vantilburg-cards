import { afterEach, beforeAll, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { HomeHouseCard } from '../../src/cards/house-card';
import { HomeWasteCard } from '../../src/cards/waste-card';
import { HomeRoomCard } from '../../src/cards/room-card';
import { HomeOverviewCardEditor } from '../../src/editor';
import type { CardConfig, CardElement, HomeAssistant } from '../../src/types';
import '../../src/index';
import { loadBubbleFixture } from '../../src/demo/bubble-runtime';

beforeAll(async () => {
  window.loadCardHelpers = async () => ({ createCardElement: config => {
    const card = config.type === 'custom:bubble-card' ? document.createElement('bubble-card') as CardElement : new TestChildCard();
    card.setConfig(config); return card;
  } });
  await loadBubbleFixture();
});

afterEach(() => { document.body.replaceChildren(); history.replaceState(null, '', '/'); window.loadCardHelpers = undefined; });
it('renders percentage bars and distinguishes unavailable from zero', async () => {
  const card = new HomeHouseCard();
  card.setConfig({ type: 'custom:home-house-card', meters: [{ name: 'Battery', entity: 'sensor.battery' }, { name: 'Heat', entity: 'sensor.heat' }] });
  card.hass = { states: { 'sensor.battery': { state: '0', attributes: {} } } }; document.body.append(card); await card.updateComplete;
  await expect.element(page.getByText('Battery 0% · Heat —')).toBeVisible();
  await expect.element(page.getByRole('progressbar', { name: 'Battery' })).toHaveAttribute('aria-valuenow', '0');
  await expect.element(page.getByRole('img', { name: 'Heat: Unavailable' })).toBeVisible();
});
it('updates waste state and escapes custom labels', async () => {
  const card = new HomeWasteCard();
  card.setConfig({ type: 'custom:home-waste-card', entity: 'sensor.days', type_entity: 'sensor.type', type_names: { pmd: '<b>PMD</b>' } });
  card.hass = { states: { 'sensor.days': { state: '0', attributes: {} }, 'sensor.type': { state: 'pmd', attributes: {} } } }; document.body.append(card); await card.updateComplete;
  await expect.element(page.getByText('Collection today')).toBeVisible();
  expect(card.shadowRoot!.querySelector('b')).toBeNull();
  card.hass = { states: {} }; await card.updateComplete;
  await expect.element(page.getByText('Schedule unavailable')).toBeVisible();
});
it('emits more-info without calling a service', async () => {
  const card = new HomeWasteCard(); card.setConfig({ type: 'custom:home-waste-card', entity: 'sensor.days', tap_action: { action: 'more-info' } }); card.hass = { states: {} };
  let id: string | undefined; card.addEventListener('hass-more-info', (event) => { id = (event as CustomEvent).detail.entityId; }); document.body.append(card); await card.updateComplete;
  await page.getByRole('button').click(); expect(id).toBe('sensor.days');
});
class TestChildCard extends HTMLElement implements CardElement {
  config: Record<string, unknown> = {};
  private _hass: HomeAssistant = { states: {} };
  setConfig(config: Record<string, unknown>) { this.config = config; }
  set hass(hass: HomeAssistant) { this._hass = hass; this.textContent = `Child ${hass.states['sensor.value']?.state || 'missing'}`; }
  get hass() { return this._hass; }
}
if (!customElements.get('test-child-card')) customElements.define('test-child-card', TestChildCard);
async function popupCard() {
  window.loadCardHelpers = async () => ({ createCardElement: config => { const card = config.type === 'custom:bubble-card' ? document.createElement('bubble-card') as CardElement : new TestChildCard(); card.setConfig(config); return card; } });
  const card = new HomeRoomCard();
  card.setConfig({ type: 'custom:home-room-card', name: 'Bedroom', entity: 'sensor.temp', popup: { hash: '#bedroom', sections: [{ title: 'Climate', icon: 'mdi:thermometer', cards: [{ type: 'test-child-card' }] }] } });
  card.hass = { states: { 'sensor.temp': { state: '19', attributes: {} }, 'sensor.value': { state: 'one', attributes: {} } } }; document.body.append(card); await card.updateComplete;
  return card;
}
it('delegates opening, child state and Escape closing to real Bubble Card', async () => {
  const card = await popupCard();
  await page.getByRole('button', { name: 'Bedroom 19.0°' }).click();
  await expect.element(page.elementLocator(document.body).getByText('Bedroom', { exact: true }).last()).toBeVisible();
  await expect.element(page.getByText('Child one')).toBeVisible();
  expect(location.hash).toBe('#bedroom');
  card.hass = { states: { 'sensor.temp': { state: '20', attributes: {} }, 'sensor.value': { state: 'two', attributes: {} } } }; await card.updateComplete;
  await expect.element(page.getByText('Child two')).toBeVisible();
  await expect.poll(() => !!document.querySelector('bubble-card')?.shadowRoot?.querySelector('.is-popup-opened:not(.is-opening):not(.is-closing)')).toBe(true);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => location.hash).toBe('');
  expect(card.shadowRoot!.querySelector('home-overview-popup')!.shadowRoot!.querySelector('dialog')).toBeNull();
  expect(document.querySelector('[data-vantilburg-popup] bubble-card')).not.toBeNull();
});
it('supports browser back, forward and direct hash links', async () => {
  const card = await popupCard();
  await page.getByRole('button', { name: 'Bedroom 19.0°' }).click();
  await expect.element(page.getByText('Child one')).toBeVisible();
  history.back(); await expect.poll(() => location.hash).toBe('');
  history.forward(); await expect.poll(() => location.hash).toBe('#bedroom');
  await expect.poll(() => !!document.querySelector('bubble-card')?.shadowRoot?.querySelector('.is-popup-opened:not(.is-opening):not(.is-closing)')).toBe(true);
  await expect.element(page.getByText('Child one')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => location.hash).toBe('');
  location.hash = '#bedroom'; await expect.element(page.getByText('Child one')).toBeVisible();
});
it('removes popup listeners when a card disconnects', async () => {
  const card = await popupCard();
  await expect.poll(() => !!document.querySelector('[data-vantilburg-popup] bubble-card')).toBe(true);
  card.remove();
  location.hash = '#bedroom';
  expect(document.querySelector('home-room-card')).toBeNull();
  expect(document.querySelector('[data-vantilburg-popup]')).toBeNull();
});
it('keeps child more-info events inside the Home Assistant app and cleans up its host', async () => {
  const app = document.createElement('home-assistant');
  const root = app.attachShadow({ mode: 'open' }); document.body.append(app);
  let entityId = '';
  app.addEventListener('hass-more-info', event => { entityId = (event as CustomEvent).detail.entityId; });
  const card = await popupCard();
  await page.getByRole('button', { name: 'Bedroom 19.0°' }).click();
  await expect.element(page.getByText('Child one')).toBeVisible();
  const child = root.querySelector('bubble-card')!.shadowRoot!.querySelector('test-child-card')!;
  child.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: 'sensor.value' } }));
  expect(entityId).toBe('sensor.value');
  expect(card.getBoundingClientRect().height).toBeGreaterThan(0);
  card.remove(); expect(root.querySelector('[data-vantilburg-popup]')).toBeNull();
});
it('editor preserves popup, layout and unrelated config fields', async () => {
  const editor = new HomeOverviewCardEditor();
  const config: CardConfig = { type: 'custom:home-room-card', entity: 'sensor.temp', grid_options: { columns: 6 }, popup: { hash: '#room', sections: [] } };
  editor.setConfig(config); document.body.append(editor); await editor.updateComplete;
  let result: CardConfig | undefined;
  editor.addEventListener('config-changed', event => { result = (event as CustomEvent).detail.config; });
  editor.shadowRoot!.querySelector('ha-form')!.dispatchEvent(new CustomEvent('value-changed', { detail: { value: { ...config, name: 'New room' } } }));
  expect(result?.name).toBe('New room'); expect(result?.grid_options).toEqual({ columns: 6 }); expect(result?.popup).toEqual(config.popup);
});
