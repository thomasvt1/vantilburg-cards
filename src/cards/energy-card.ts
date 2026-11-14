import { html, nothing } from 'lit';
import { BaseCard } from '../base-card';
import { energyReading } from '../data';
import type { EnergyConfig, HomeAssistant } from '../types';
export class HomeEnergyCard extends BaseCard {
  protected get defaultPalette() { return 'purple' as const; }
  protected get defaultName() { return this.t.energy; }
  static getStubConfig(hass?: HomeAssistant): EnergyConfig {
    const power = Object.keys(hass?.states || {}).filter(id => id.startsWith('sensor.') && hass?.states[id]?.attributes.device_class === 'power');
    return { type: 'custom:home-energy-card', name: 'Heating', icon: 'mdi:heat-pump-outline', palette: 'purple', devices: [{ entity: power[0] || 'sensor.heat_pump_power' }] };
  }
  protected entityIds() { const config = this.config as EnergyConfig; return [config.home_entity, ...config.devices.map(device => device.entity)]; }
  protected content() {
    const config = this.config as EnergyConfig;
    const reading = energyReading(config, this.hass || { states: {} });
    const name = config.name || this.t.energy;
    const share = reading.share === undefined ? nothing
      : html`<div class="track share" style="--meter-track:color-mix(in srgb,var(--hoc-accent) 16%,transparent);--meter-fill:var(--hoc-accent)" role="progressbar" aria-label=${`${name}: ${this.t.share}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(reading.share)}><div class="fill" style=${`width:${reading.share}%`}></div></div>`;
    const rows = config.remainder
      ? html`<li class="idle"><span class="device-name">${this.t.metered}</span><span class="reading">${reading.meteredText}</span></li>`
      : reading.rows.map(row => html`<li class=${row.idle ? 'idle' : ''}><span class="device-name">${row.name}</span><span class="reading">${row.text}</span></li>`);
    return this.shell(html`<div class=${`energy-head ${this.actionable ? 'action' : ''}`}>
        <span class="badge" aria-hidden="true"><ha-icon .icon=${config.icon || 'mdi:lightning-bolt-outline'}></ha-icon></span>
        <div><div class="name">${name}</div><div class="value secondary">${reading.subtitle}</div></div>
        <div class=${`total ${reading.total === undefined ? 'small' : ''}`}>${reading.totalText}</div>${this.arrow()}
      </div>${share}<ul class="devices">${rows}</ul>`);
  }
}
