import { LitElement, css, html } from 'lit';
import { mdiSofa, mdiCountertopOutline, mdiBedKingOutline, mdiDesk, mdiBabyCarriage, mdiHomeRoof, mdiStairs, mdiFlowerOutline, mdiHomeOutline, mdiTrashCanOutline, mdiThermometer, mdiLightbulbOutline, mdiHeatPumpOutline, mdiSolarPower, mdiTransmissionTower, mdiBattery50, mdiHomeLightningBoltOutline, mdiWashingMachine, mdiFridgeOutline, mdiMeterElectricOutline, mdiCurrentAc, mdiLightningBoltOutline } from '@mdi/js';
import '../index';
import type { CardConfig, CardElement, HomeAssistant } from '../types';
import './style.css';
import { loadBubbleFixture } from './bubble-runtime';


const icons: Record<string, string> = { 'mdi:sofa': mdiSofa, 'mdi:countertop-outline': mdiCountertopOutline, 'mdi:bed-king-outline': mdiBedKingOutline, 'mdi:desk': mdiDesk, 'mdi:baby-carriage': mdiBabyCarriage, 'mdi:home-roof': mdiHomeRoof, 'mdi:stairs': mdiStairs, 'mdi:flower-outline': mdiFlowerOutline, 'mdi:home-outline': mdiHomeOutline, 'mdi:trash-can-outline': mdiTrashCanOutline, 'mdi:thermometer': mdiThermometer, 'mdi:lightbulb-outline': mdiLightbulbOutline, 'mdi:heat-pump-outline': mdiHeatPumpOutline, 'mdi:solar-power': mdiSolarPower, 'mdi:transmission-tower': mdiTransmissionTower, 'mdi:battery-50': mdiBattery50, 'mdi:home-lightning-bolt-outline': mdiHomeLightningBoltOutline, 'mdi:washing-machine': mdiWashingMachine, 'mdi:fridge-outline': mdiFridgeOutline, 'mdi:meter-electric-outline': mdiMeterElectricOutline, 'mdi:current-ac': mdiCurrentAc, 'mdi:lightning-bolt-outline': mdiLightningBoltOutline };
class DemoIcon extends LitElement {
  static properties = { icon: { type: String } }; icon = '';
  static styles = css`:host{display:inline-flex;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px)}svg{width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px);fill:currentColor;flex:none}`;
  render() { return html`<svg viewBox="0 0 24 24" aria-hidden="true"><path d=${icons[this.icon] || mdiHomeOutline}></path></svg>`; }
}
customElements.define('ha-icon', DemoIcon);
let hass: HomeAssistant = { language: 'en', themes: { darkMode: false }, states: {
  'sensor.days': { state: '3', attributes: {} }, 'sensor.waste': { state: 'pmd', attributes: {} },
  'sensor.battery': { state: '21', attributes: {} }, 'sensor.heat': { state: '62', attributes: {} },
  'light.hallway': { state: 'off', attributes: {} }, 'light.outside': { state: 'off', attributes: {} },
} };
const power = (state: string, unit = 'W') => ({ state, attributes: { unit_of_measurement: unit } });
Object.assign(hass.states, {
  'sensor.home_power': power('1320'), 'sensor.solar_power': power('260'), 'sensor.grid_power': power('1060'), 'sensor.battery_soc': power('34', '%'), 'sensor.battery_power': power('0'),
  'sensor.heat_pump_power': power('905'), 'sensor.boiler_tap_power': power('1'), 'sensor.desks_power': power('128'), 'sensor.network_power': power('92'), 'sensor.server_power': power('61'), 'sensor.printer_power': power('unavailable'),
  'sensor.fridge_power': power('3'), 'sensor.dishwasher_power': power('2'), 'sensor.oven_power': power('0'), 'sensor.washer_power': power('2'),
  'sensor.phase_1': power('0.4', 'A'), 'sensor.phase_2': power('4.4', 'A'), 'sensor.phase_3': power('0.7', 'A'),
});
const metered = ['heat_pump', 'boiler_tap', 'desks', 'network', 'server', 'printer', 'fridge', 'dishwasher', 'oven', 'washer'].map(id => ({ entity: `sensor.${id}_power` }));
const energy: CardConfig[] = [
  { type: 'custom:home-power-card', name: 'Home', icon: 'mdi:home-lightning-bolt-outline', palette: 'slate', entity: 'sensor.home_power' },
  { type: 'custom:home-power-card', name: 'Solar', icon: 'mdi:solar-power', palette: 'peach', entity: 'sensor.solar_power' },
  { type: 'custom:home-power-card', name: 'Grid', icon: 'mdi:transmission-tower', palette: 'blue', entity: 'sensor.grid_power' },
  { type: 'custom:home-power-card', name: 'Battery', icon: 'mdi:battery-50', palette: 'teal', entity: 'sensor.battery_soc', secondary_entity: 'sensor.battery_power' },
  { type: 'custom:home-energy-card', name: 'Heating & hot water', icon: 'mdi:heat-pump-outline', palette: 'purple', home_entity: 'sensor.home_power', devices: [{ entity: 'sensor.heat_pump_power', name: 'Heat pump' }, { entity: 'sensor.boiler_tap_power', name: 'Boiling-water tap' }] },
  { type: 'custom:home-energy-card', name: 'Office & network', icon: 'mdi:desk', palette: 'indigo', home_entity: 'sensor.home_power', devices: [{ entity: 'sensor.desks_power', name: 'Desks' }, { entity: 'sensor.network_power', name: 'Network' }, { entity: 'sensor.server_power', name: 'Server' }, { entity: 'sensor.printer_power', name: '3D printer' }] },
  { type: 'custom:home-energy-card', name: 'Kitchen & laundry', icon: 'mdi:fridge-outline', palette: 'mint', home_entity: 'sensor.home_power', devices: [{ entity: 'sensor.fridge_power', name: 'Refrigerator' }, { entity: 'sensor.dishwasher_power', name: 'Dishwasher' }, { entity: 'sensor.washer_power', name: 'Washing machine' }, { entity: 'sensor.oven_power', name: 'Oven' }] },
  { type: 'custom:home-energy-card', name: 'Not metered', icon: 'mdi:meter-electric-outline', palette: 'neutral', home_entity: 'sensor.home_power', remainder: true, devices: metered },
  { type: 'custom:home-house-card', name: 'Grid phases', icon: 'mdi:current-ac', meters: [1, 2, 3].map(n => ({ entity: `sensor.phase_${n}`, name: `L${n}`, max: 25, palette: 'blue' as const })) },
];
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
await loadBubbleFixture();
const header = document.createElement('header');
header.innerHTML = '<span>vanTilburg Cards · Demo data</span><button type="button">Toggle dark mode</button>';
document.body.append(header);
const main = document.createElement('main'); main.innerHTML = '<section class="summary" aria-label="Household"></section><section class="rooms" aria-label="Rooms"></section><section class="energy" aria-label="Energy"></section>'; document.body.append(main);
configs.forEach((config, i) => main.querySelector(i < 2 ? '.summary' : '.rooms')!.append(create(config)));
energy.forEach(config => main.querySelector('.energy')!.append(create(config)));
function theme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  hass = { ...hass, themes: { darkMode: dark } };
  document.querySelectorAll<CardElement>('home-room-card,home-house-card,home-waste-card,home-energy-card,home-power-card').forEach(card => { card.hass = hass; });
}
header.querySelector('button')!.addEventListener('click', () => theme(!hass.themes?.darkMode));
theme(new URLSearchParams(location.search).get('theme') === 'dark');
