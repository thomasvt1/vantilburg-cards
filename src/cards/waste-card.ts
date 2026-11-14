import { BaseCard } from '../base-card';
import { wasteReading } from '../data';
import type { WasteConfig } from '../types';
export class HomeWasteCard extends BaseCard {
  protected get defaultPalette() { return 'mint' as const; }
  protected get defaultName() { return this.t.waste; }
  static getStubConfig(): WasteConfig { return { type: 'custom:home-waste-card', entity: 'sensor.collection_days', palette: 'mint' }; }
  protected entityIds() { const config = this.config as WasteConfig; return [config.entity, config.type_entity, config.moved_entity]; }
  protected content() {
    const config = this.config as WasteConfig;
    const reading = wasteReading(config, this.hass || { states: {} });
    return this.shell(this.row(reading.title, config.icon || 'mdi:trash-can-outline', reading.text, false, true));
  }
}
