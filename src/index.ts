import { HomeRoomCard } from './cards/room-card';
import { HomeHouseCard } from './cards/house-card';
import { HomeWasteCard } from './cards/waste-card';
import { HomeEnergyCard } from './cards/energy-card';
import { HomePowerCard } from './cards/power-card';
import './editor';
import { version } from '../package.json';
declare global { interface Window { customCards?: { type: string; name: string; description: string; preview: boolean }[] } }
window.customCards ||= [];
const cards = [
  ['home-room-card', HomeRoomCard, 'vanTilburg Room', 'Room temperature or lights on, with an optional sectioned popup.'],
  ['home-house-card', HomeHouseCard, 'vanTilburg House', 'Household percentage sensors with compact progress bars.'],
  ['home-waste-card', HomeWasteCard, 'vanTilburg Waste', 'Collection countdown, waste type and bin-out status.'],
  ['home-energy-card', HomeEnergyCard, 'vanTilburg Energy group', 'Combined power of a group of devices, its share of home use and each device.'],
  ['home-power-card', HomePowerCard, 'vanTilburg Power', 'One power or percentage reading with an optional second value.'],
] as const;
for (const [type, element, name, description] of cards) {
  if (!customElements.get(type)) customElements.define(type, element);
  if (!window.customCards.some(c => c.type === type)) window.customCards.push({ type, name, description, preview: true });
}
console.info(`vanTilburg Cards ${version}`);
