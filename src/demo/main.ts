import { LitElement, css, html } from 'lit';
import { mdiSofa, mdiCountertopOutline, mdiBedKingOutline, mdiDesk, mdiBabyCarriage, mdiHomeRoof, mdiStairs, mdiFlowerOutline, mdiHomeOutline, mdiTrashCanOutline, mdiThermometer, mdiLightbulbOutline } from '@mdi/js';
import '../index';
import type { CardConfig, CardElement, HomeAssistant } from '../types';
import './style.css';

const icons: Record<string, string> = { 'mdi:sofa': mdiSofa, 'mdi:countertop-outline': mdiCountertopOutline, 'mdi:bed-king-outline': mdiBedKingOutline, 'mdi:desk': mdiDesk, 'mdi:baby-carriage': mdiBabyCarriage, 'mdi:home-roof': mdiHomeRoof, 'mdi:stairs': mdiStairs, 'mdi:flower-outline': mdiFlowerOutline, 'mdi:home-outline': mdiHomeOutline, 'mdi:trash-can-outline': mdiTrashCanOutline, 'mdi:thermometer': mdiThermometer, 'mdi:lightbulb-outline': mdiLightbulbOutline };
class DemoIcon extends LitElement {
  static properties = { icon: { type: String } }; icon = '';
  static styles = css`:host{display:inline-flex;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px)}svg{width:100%;height:100%;fill:currentColor}`;
  render() { return html`<svg viewBox="0 0 24 24" aria-hidden="true"><path d=${icons[this.icon] || mdiHomeOutline}></path></svg>`; }
}
customElements.define('ha-icon', DemoIcon);
let hass: HomeAssistant = { language: 'en', themes: { darkMode: false }, states: {
  'sensor.days': { state: '3', attributes: {} }, 'sensor.waste': { state: 'pmd', attributes: {} },
  'sensor.battery': { state: '21', attributes: {} }, 'sensor.heat': { state: '62', attributes: {} },
  'light.hallway': { state: 'off', attributes: {} }, 'light.outside': { state: 'off', attributes: {} },
} };
const rooms = [
  ['Living Room', 'sofa', 'blue', '20.0'], ['Kitchen', 'countertop-outline', 'peach', '22.8'],
  ['Bedroom', 'bed-king-outline', 'purple', '18.9'], ['Office', 'desk', 'teal', '22.6'],
  ['Baby Room', 'baby-carriage', 'pink', '20.9'], ['Attic', 'home-roof', 'indigo', '21.5'],
] as const;
const configs: CardConfig[] = [
  { type: 'custom:home-waste-card', entity: 'sensor.days', type_entity: 'sensor.waste', popup: { hash: '#waste', title: 'Trash collection', sections: [{ title: 'Next collection', cards: [{ type: 'custom:home-waste-card', entity: 'sensor.days', type_entity: 'sensor.waste' }] }] } },
  { type: 'custom:home-house-card', name: 'House', meters: [{ entity: 'sensor.battery', name: 'Battery', palette: 'mint' }, { entity: 'sensor.heat', name: 'Heat', palette: 'purple' }], popup: { hash: '#house', sections: [{ title: 'Stored energy', cards: [{ type: 'custom:home-house-card', meters: [{ entity: 'sensor.battery', name: 'Battery' }, { entity: 'sensor.heat', name: 'Heat' }] }] }] } },
  ...rooms.map(([name, icon, palette, state], i) => {
    const entity = `sensor.room_${i}`;
    hass.states[entity] = { state, attributes: { unit_of_measurement: '°C' } };
    return { type: 'custom:home-room-card' as const, name, icon: `mdi:${icon}`, palette, entity, popup: { hash: `#room-${i}`, sections: [{ title: 'Climate', icon: 'mdi:thermometer', cards: [{ type: 'custom:home-room-card', name: 'Temperature', entity, palette, icon: 'mdi:thermometer' }] }] } };
  }),
  { type: 'custom:home-room-card', name: 'Hallway', icon: 'mdi:stairs', palette: 'slate', lights: ['light.hallway'], tap_action: { action: 'more-info', entity: 'light.hallway' } },
  { type: 'custom:home-room-card', name: 'Outside', icon: 'mdi:flower-outline', palette: 'green', lights: ['light.outside'], tap_action: { action: 'more-info', entity: 'light.outside' } },
];
function create(config: Record<string, unknown>) { const card = document.createElement(String(config.type).replace('custom:', '')) as CardElement; card.setConfig(config); card.hass = hass; return card; }
window.loadCardHelpers = async () => ({ createCardElement: create });
const header = document.createElement('header');
header.innerHTML = '<span>vanTilburg Cards · Demo data</span><button type="button">Toggle dark mode</button>';
document.body.append(header);
const main = document.createElement('main'); main.innerHTML = '<section class="summary" aria-label="Household"></section><section class="rooms" aria-label="Rooms"></section>'; document.body.append(main);
configs.forEach((config, i) => main.querySelector(i < 2 ? '.summary' : '.rooms')!.append(create(config)));
function theme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  hass = { ...hass, themes: { darkMode: dark } };
  document.querySelectorAll<CardElement>('home-room-card,home-house-card,home-waste-card').forEach(card => { card.hass = hass; });
}
header.querySelector('button')!.addEventListener('click', () => theme(!hass.themes?.darkMode));
theme(new URLSearchParams(location.search).get('theme') === 'dark');
