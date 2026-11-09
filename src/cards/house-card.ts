import { html } from 'lit';
import { BaseCard } from '../base-card';
import { meterReading } from '../data';
import type { HouseConfig, HomeAssistant } from '../types';
export class HomeHouseCard extends BaseCard {
  protected get defaultPalette() { return 'neutral' as const; }
  static getStubConfig(hass?: HomeAssistant): HouseConfig {
    const entity = Object.keys(hass?.states || {}).find(id => id.startsWith('sensor.') && hass?.states[id]?.attributes.unit_of_measurement === '%') || 'sensor.battery_percentage';
    return { type: 'custom:home-house-card', name: 'House', meters: [{ entity, name: 'Battery', palette: 'mint' }] };
  }
  protected content() {
    const config = this.config as HouseConfig;
    const readings = config.meters.map(m => meterReading(m, this.hass || { states: {} }));
    return this.shell(html`${this.row(config.name || this.t.house, config.icon || 'mdi:home-outline', readings.map(r => `${r.name} ${r.text}`).join(' · '), false, true)}<div class="bars">${readings.map((r, i) => {
      const [, track, fill] = this.colors(config.meters[i].palette || (i % 2 ? 'purple' : 'mint'));
      return r.value === undefined
        ? html`<div class="track unavailable" style=${`--meter-track:${track}`} role="img" aria-label=${`${r.name}: ${this.t.unavailable}`}></div>`
        : html`<div class="track" style=${`--meter-track:${track};--meter-fill:${fill}`} role="progressbar" aria-label=${r.name} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${r.value}><div class="fill" style=${`width:${r.value}%`}></div></div>`;
    })}</div>`);
  }
}
