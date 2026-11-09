import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { HomeRoomCard } from '../../src/cards/room-card';
import '../../src/index';
afterEach(() => { document.body.replaceChildren(); history.replaceState(null, '', '/'); });
function mount() {
  const card = new HomeRoomCard();
  card.setConfig({ type: 'custom:home-room-card', name: 'Living Room', entity: 'climate.room', tap_action: { action: 'navigate', navigation_path: '#soft-living-room' } });
  card.hass = { states: { 'climate.room': { state: 'heat', attributes: { current_temperature: 20 } } } };
  document.body.append(card);
  return card;
}
it('renders, updates state and switches palette', async () => {
  const card = mount(); await card.updateComplete;
  await expect.element(page.getByText('20.0°', { exact: true })).toBeVisible();
  expect(getComputedStyle(card).getPropertyValue('--hoc-bg')).toBe('#e7f5fc');
  card.hass = { themes: { darkMode: true }, states: { 'climate.room': { state: 'heat', attributes: { current_temperature: 21.2 } } } };
  await card.updateComplete;
  await expect.element(page.getByText('21.2°', { exact: true })).toBeVisible();
  expect(getComputedStyle(card).getPropertyValue('--hoc-bg')).toBe('#193e52');
});
it('navigates through the Home Assistant location event', async () => {
  const card = mount(); await card.updateComplete;
  let observed = false;
  window.addEventListener('location-changed', () => { observed = true; }, { once: true });
  await page.getByRole('button', { name: 'Living Room 20.0°' }).click();
  expect(location.hash).toBe('#soft-living-room'); expect(observed).toBe(true);
});
it('uses a focusable native button and reports missing data', async () => {
  const card = mount(); card.hass = { states: {} }; await card.updateComplete;
  const button = card.shadowRoot!.querySelector('button')!;
  button.focus(); expect(card.shadowRoot!.activeElement).toBe(button);
  await expect.element(page.getByText('Unavailable', { exact: true })).toBeVisible();
});
