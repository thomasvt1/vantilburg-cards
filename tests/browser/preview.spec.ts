import { afterEach, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { HomeRoomCard } from '../../src/cards/room-card';
import { HomeWasteCard } from '../../src/cards/waste-card';
import { HomeHouseCard } from '../../src/cards/house-card';
import type { CardConfig, CardElement, HomeAssistant, RoomConfig } from '../../src/types';
import '../../src/index';

class PreviewChild extends HTMLElement implements CardElement {
  preview = false;
  editMode = false;
  private name = '';
  setConfig(config: Record<string, unknown>) { this.name = String(config.name); }
  set hass(hass: HomeAssistant) { this.textContent = `${this.name}: ${hass.states['sensor.temp']?.state}`; }
}
customElements.define('test-preview-child', PreviewChild);
const config: RoomConfig = { type: 'custom:home-room-card', name: 'Bedroom', entity: 'sensor.temp', palette: 'purple', popup: { hash: '#bedroom', sections: [{ title: 'Climate', cards: [{ type: 'test-preview-child', name: 'Temperature' }] }] } };
const hass: HomeAssistant = { states: { 'sensor.temp': { state: '19', attributes: {} } } };
function makeCard(parent: Node, value = config, preview = true) {
  if (parent === document.body && preview) { const editor = document.createElement('hui-dialog-edit-card'); parent.appendChild(editor); parent = editor; }
  window.loadCardHelpers = async () => ({ createCardElement: childConfig => { const child = new PreviewChild(); child.setConfig(childConfig); return child; } });
  const card = new HomeRoomCard(); card.preview = preview; card.setConfig(value); card.hass = hass; parent.appendChild(card); return card;
}
afterEach(() => { document.body.replaceChildren(); window.loadCardHelpers = undefined; history.replaceState(null, '', '/'); });

it('switches inline preview without navigation, a modal or active child controls', async () => {
  const card = makeCard(document.body); await card.updateComplete;
  const historyLength = history.length;
  await expect.element(page.getByRole('button', { name: 'Card', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Popup', exact: true }).click();
  await expect.element(page.getByRole('region', { name: 'Bedroom popup preview' })).toBeVisible();
  await expect.element(page.getByRole('heading', { name: 'Climate', exact: true })).toBeVisible();
  const popup = card.shadowRoot!.querySelector('home-overview-popup')!;
  await expect.poll(() => popup.shadowRoot!.querySelector('test-preview-child')?.textContent).toBe('Temperature: 19');
  const child = popup.shadowRoot!.querySelector<PreviewChild>('test-preview-child')!;
  expect(child.preview).toBe(true); expect(child.editMode).toBe(true);
  expect(popup.shadowRoot!.querySelector('.cards')!.hasAttribute('inert')).toBe(true);
  expect(popup.shadowRoot!.querySelector('dialog')).toBeNull();
  expect(location.hash).toBe(''); expect(history.length).toBe(historyLength);
  await page.getByRole('button', { name: 'Card', exact: true }).click();
  await expect.element(page.getByRole('button', { name: 'Bedroom 19.0°' })).toBeVisible();
});

it('retains the selected preview across HA draft rebuilds, scoped to one editor', async () => {
  const editor = document.createElement('hui-dialog-edit-card'); document.body.append(editor);
  const root = editor.attachShadow({ mode: 'open' });
  const card = makeCard(root); await card.updateComplete;
  await page.getByRole('button', { name: 'Popup', exact: true }).click();
  card.remove();
  const draft = structuredClone(config);
  draft.popup!.title = 'Unsaved title'; draft.popup!.sections = [{ title: 'Lighting', columns: 2, cards: [{ type: 'test-preview-child', name: 'New child' }] }];
  const replacement = makeCard(root, draft); await replacement.updateComplete;
  await expect.element(page.getByRole('region', { name: 'Unsaved title popup preview' })).toBeVisible();
  await expect.element(page.getByRole('heading', { name: 'Lighting' })).toBeVisible();
  const popup = replacement.shadowRoot!.querySelector('home-overview-popup')!;
  await expect.poll(() => popup.shadowRoot!.querySelector('test-preview-child')?.textContent).toBe('New child: 19');
  expect(popup.shadowRoot!.querySelector('.cards')!.getAttribute('style')).toBe('--columns:2');
  expect(draft).not.toHaveProperty('preview'); expect(config.popup!.title).toBeUndefined();
  editor.remove();
  const nextEditor = document.createElement('hui-dialog-edit-card'); document.body.append(nextEditor); const next = makeCard(nextEditor); await next.updateComplete;
  await expect.element(page.getByRole('button', { name: 'Card', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

it('refreshes an existing inline preview for unsaved config and state changes', async () => {
  const card = makeCard(document.body); await card.updateComplete;
  await page.getByRole('button', { name: 'Popup', exact: true }).click();
  const draft = structuredClone(config); draft.popup!.sections[0].title = 'Updated section';
  card.setConfig(draft); card.hass = { states: { 'sensor.temp': { state: '21', attributes: {} } } }; await card.updateComplete;
  await expect.element(page.getByRole('heading', { name: 'Updated section' })).toBeVisible();
  const popup = card.shadowRoot!.querySelector('home-overview-popup')!;
  await expect.poll(() => popup.shadowRoot!.querySelector('test-preview-child')?.textContent).toBe('Temperature: 21');
  card.setConfig({ type: 'custom:home-room-card', entity: 'sensor.temp' }); await card.updateComplete;
  expect(card.shadowRoot!.querySelector('.preview-switch')).toBeNull();
  expect(card.shadowRoot!.querySelector('home-overview-popup')).toBeNull();
});

it('supports keyboard switching and keeps preview controls off dashboard cards', async () => {
  const card = makeCard(document.body); await card.updateComplete;
  await page.getByRole('button', { name: 'Card', exact: true }).click();
  await userEvent.keyboard('{Tab}{Enter}');
  await expect.element(page.getByRole('button', { name: 'Popup', exact: true })).toHaveAttribute('aria-pressed', 'true');
  card.preview = false; await card.updateComplete;
  expect(card.shadowRoot!.querySelector('.preview-switch')).toBeNull();
  await page.getByRole('button', { name: 'Bedroom 19.0°' }).click();
  await expect.element(page.getByRole('dialog', { name: 'Bedroom' })).toBeVisible();
});

it('does not add the switch to cards in dashboard layout-edit mode', async () => {
  const card = makeCard(document.body, config, false); card.preview = true; await card.updateComplete;
  expect(card.shadowRoot!.querySelector('.preview-switch')).toBeNull();
  await page.getByRole('button', { name: 'Bedroom 19.0°' }).click();
  expect(location.hash).toBe('');
  expect(card.shadowRoot!.querySelector('home-overview-popup')).toBeNull();
});

it('keeps all three card heights unchanged inside a tall editor preview area', async () => {
  const cases: [typeof HomeRoomCard | typeof HomeWasteCard | typeof HomeHouseCard, CardConfig][] = [
    [HomeRoomCard, config],
    [HomeWasteCard, { type: 'custom:home-waste-card', entity: 'sensor.days', popup: config.popup }],
    [HomeHouseCard, { type: 'custom:home-house-card', meters: [{ entity: 'sensor.battery', name: 'Battery' }], popup: config.popup }],
  ];
  for (const [Card, value] of cases) {
    const normal = new Card(); normal.setConfig(value); normal.hass = hass;
    normal.style.width = '480px'; document.body.append(normal); await normal.updateComplete;
    const height = normal.shadowRoot!.querySelector('ha-card')!.getBoundingClientRect().height;
    normal.remove();
    const editor = document.createElement('hui-dialog-edit-card');
    editor.style.cssText = 'display:grid;width:480px;height:320px;align-items:stretch'; document.body.append(editor);
    normal.preview = true; editor.append(normal); await normal.updateComplete;
    expect(normal.shadowRoot!.querySelector('ha-card')!.getBoundingClientRect().height).toBeCloseTo(height, 0);
    expect(normal.getBoundingClientRect().height).toBeLessThan(250);
    editor.remove();
  }
});
