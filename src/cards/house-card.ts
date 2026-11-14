import { html } from 'lit';
import { BaseCard } from '../base-card';
import { limitColors } from '../appearance';
import { meterReading } from '../data';
import type { HouseConfig, HomeAssistant } from '../types';
export class HomeHouseCard extends BaseCard {
  protected get defaultPalette() { return 'neutral' as const; }
  protected get defaultName() { return this.t.house; }
  static getStubConfig(hass?: HomeAssistant): HouseConfig {
    const entity = Object.keys(hass?.states || {}).find(id => id.startsWith('sensor.') && hass?.states[id]?.attributes.unit_of_measurement === '%') || 'sensor.battery_percentage';
    return { type: 'custom:home-house-card', name: 'House', meters: [{ entity, name: 'Battery', palette: 'mint' }] };
  }
  protected entityIds() { return (this.config as HouseConfig).meters.map(meter => meter.entity); }
  protected content() {
    const config = this.config as HouseConfig;
    const readings = config.meters.map(m => meterReading(m, this.hass || { states: {} }));
    return this.shell(html`${this.row(config.name || this.t.house, config.icon || 'mdi:home-outline', readings.map((r, i) => html`${i ? ' · ' : ''}${this.history(config.meters[i].entity, `${r.name} ${r.text}`, r.limit === 'over' ? 'over-limit' : '')}`), false, true)}<div class="bars">${readings.map((r, i) => {
      const meter = config.meters[i];
      const palette = meter.palette || (i % 2 ? 'purple' : 'mint');
      // Near or over the limit wins over direction. Below zero (for example a phase exporting solar
      // power) the bar switches palette; the signed text and aria-valuetext carry both for non-color readers.
      const [, track, fill] = r.limit ? ['', ...limitColors[r.limit][this.dark ? 'dark' : 'light']]
        : this.colors(r.negative ? meter.negative_palette || (palette === 'purple' ? 'peach' : 'purple') : palette);
      const valueText = r.limit ? `${r.text}, ${r.limit === 'over' ? this.t.overLimit : this.t.nearLimit}` : r.text;
      return r.value === undefined
        ? html`<div class="track unavailable" style=${`--meter-track:${track}`} role="img" aria-label=${`${r.name}: ${this.t.unavailable}`}></div>`
        : html`<div class=${`track ${r.negative ? 'negative' : ''} ${r.limit ? `limit-${r.limit}` : ''}`} style=${`--meter-track:${track};--meter-fill:${fill}`} role="progressbar" aria-label=${r.name} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${r.value} aria-valuetext=${valueText}><div class="fill" style=${`width:${r.value}%`}></div></div>`;
    })}</div>`);
  }
}
