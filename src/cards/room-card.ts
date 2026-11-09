import { BaseCard } from '../base-card';
import { roomReading } from '../data';
import type { HomeAssistant, RoomConfig } from '../types';
export class HomeRoomCard extends BaseCard {
  protected get defaultPalette() { return 'blue' as const; }
  static getStubConfig(hass?: HomeAssistant): RoomConfig {
    const entity = Object.keys(hass?.states || {}).find(id => id.startsWith('climate.')) || Object.keys(hass?.states || {}).find(id => hass?.states[id]?.attributes.device_class === 'temperature') || 'sensor.room_temperature';
    return { type: 'custom:home-room-card', name: 'Room', entity, palette: 'blue' };
  }
  protected content() {
    const config = this.config as RoomConfig;
    const reading = roomReading(config, this.hass || { states: {} });
    return this.shell(this.row(config.name || this.t.room, config.icon || 'mdi:sofa', reading.text, reading.mode === 'lights' || reading.unavailable), 'room');
  }
}
