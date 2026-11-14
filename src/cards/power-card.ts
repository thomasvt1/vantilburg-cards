import { html, nothing } from 'lit';
import { BaseCard } from '../base-card';
import { powerReading } from '../data';
import type { HomeAssistant, PowerConfig } from '../types';
export class HomePowerCard extends BaseCard {
  protected get defaultPalette() { return 'slate' as const; }
  protected get defaultName() { return this.t.power; }
  static getStubConfig(hass?: HomeAssistant): PowerConfig {
    const entity = Object.keys(hass?.states || {}).find(id => id.startsWith('sensor.') && hass?.states[id]?.attributes.device_class === 'power') || 'sensor.home_power';
    return { type: 'custom:home-power-card', name: 'Home', icon: 'mdi:home-lightning-bolt-outline', entity, palette: 'slate' };
  }
  protected entityIds() { const config = this.config as PowerConfig; return [config.entity, config.secondary_entity]; }
  protected content() {
    const config = this.config as PowerConfig;
    const reading = powerReading(config, this.hass || { states: {} });
    const value = html`<span>${reading.text}</span>${reading.secondary === undefined ? nothing : html`<span class="sub">${reading.secondary}</span>`}`;
    return this.shell(this.row(config.name || this.t.power, config.icon || 'mdi:lightning-bolt-outline', value, reading.unavailable, reading.unavailable), 'room power');
  }
}
