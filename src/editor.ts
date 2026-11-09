import { LitElement, css, html, nothing } from 'lit';
import { palettes } from './appearance';
import type { CardConfig, HomeAssistant, HouseConfig } from './types';
import type { PopupConfig } from './types';
import './popup-editor';

type FormField = { name: string; label?: string; required?: boolean; selector: Record<string, unknown> };
const text = (name: string, label: string): FormField => ({ name, label, selector: { text: {} } });
const entity = (name: string, label: string, domain?: string | string[], multiple = false): FormField => ({ name, label, selector: { entity: { ...(domain ? { domain } : {}), ...(multiple ? { multiple } : {}) } } });
const select = (name: string, label: string, options: string[]): FormField => ({ name, label, selector: { select: { options, mode: 'dropdown' } } });
const palette = select('palette', 'Color palette', Object.keys(palettes));

export class HomeOverviewCardEditor extends LitElement {
  static properties = { hass: { attribute: false }, config: { state: true }, lovelace: { attribute: false } };
  declare hass: HomeAssistant;
  declare lovelace: Record<string, unknown> | undefined;
  private config!: CardConfig;
  static styles = css`
    :host { display:block; }
    ha-form { display:block; }
    h3 { margin:24px 0 12px; font-size:16px; }
    .meter { padding:12px; border:1px solid var(--divider-color,#ddd); border-radius:12px; margin-bottom:12px; }
    button { font:inherit; color:var(--primary-color,#246b9a); background:none; border:1px solid currentColor; border-radius:8px; padding:10px 14px; cursor:pointer; margin-top:10px; }
    button:focus-visible { outline:3px solid var(--primary-color,#246b9a); outline-offset:3px; }
    button:disabled { opacity:.5; cursor:default; }
    p { color:var(--secondary-text-color); line-height:1.5; }
    summary { padding:18px 0; cursor:pointer; }
  `;
  setConfig(config: CardConfig) { this.config = structuredClone(config); }
  private emit(config: CardConfig) {
    this.config = config;
    this.dispatchEvent(new CustomEvent('config-changed', { bubbles: true, composed: true, detail: { config } }));
  }
  private label = (schema: FormField) => schema.label || schema.name;
  private fields(): FormField[] {
    const common = [text('name', this.config.type === 'custom:home-waste-card' ? 'Title override (optional)' : 'Name'), { name: 'icon', label: 'Icon', selector: { icon: {} } }, palette, select('language', 'Language', ['auto', 'en', 'nl'])];
    if (this.config.type === 'custom:home-room-card') return [...common, select('display', 'Display', ['auto', 'temperature', 'lights']), entity('entity', 'Temperature entity', ['climate', 'sensor']), text('attribute', 'Temperature attribute (optional)'), { name: 'precision', label: 'Decimal places', selector: { number: { min: 0, max: 3, step: 1, mode: 'box' } } }, entity('lights', 'Lights', 'light', true)];
    if (this.config.type === 'custom:home-waste-card') return [...common, entity('entity', 'Days until collection', 'sensor'), entity('type_entity', 'Waste type (optional)', 'sensor'), entity('moved_entity', 'Bin put out (optional)', ['input_boolean', 'binary_sensor'])];
    return common;
  }
  private updateFields(event: CustomEvent<{ value: Record<string, unknown> }>) {
    event.stopPropagation();
    const config = { ...this.config };
    for (const field of this.fields()) {
      const value = event.detail.value[field.name];
      if (value === undefined || value === null || value === '') delete config[field.name];
      else config[field.name] = value;
    }
    this.emit(config);
  }
  private updateAction(event: CustomEvent<{ value: Record<string, string> }>) {
    event.stopPropagation();
    const value = event.detail.value;
    const config = { ...this.config };
    config.tap_action = value.action === 'navigate' ? { action: 'navigate', navigation_path: value.navigation_path || '#' }
      : value.action === 'more-info' ? { action: 'more-info', ...(value.entity ? { entity: value.entity } : {}) } : { action: 'none' };
    this.emit(config);
  }
  protected render() {
    if (!this.config) return nothing;
    const action = this.config.tap_action || { action: 'none' };
    return html`<ha-form .hass=${this.hass} .schema=${this.fields()} .data=${{ language: 'auto', display: 'auto', precision: 1, ...this.config }} .computeLabel=${this.label} @value-changed=${this.updateFields}></ha-form>
      ${this.config.type === 'custom:home-house-card' ? html`<h3>Percentage sensors</h3>${this.config.meters.map((meter, index) => html`<div class="meter"><ha-form .hass=${this.hass} .schema=${[entity('entity', 'Percentage sensor', 'sensor'), text('name', 'Label'), palette]} .data=${meter} .computeLabel=${this.label} @value-changed=${(event: CustomEvent<{ value: Record<string, unknown> }>) => {
        event.stopPropagation(); const config = this.config as HouseConfig;
        const meters = config.meters.map((m, i) => {
          if (i !== index) return m;
          const next = { ...m, ...event.detail.value };
          if (!next.palette) delete next.palette;
          return next;
        });
        this.emit({ ...config, meters });
      }}></ha-form><button @click=${() => { const config = this.config as HouseConfig; this.emit({ ...config, meters: config.meters.filter((_, i) => i !== index) }); }} ?disabled=${(this.config as HouseConfig).meters.length === 1}>Remove sensor ${index + 1}</button></div>`)}<button ?disabled=${this.config.meters.length >= 6} @click=${() => { const config = this.config as HouseConfig; this.emit({ ...config, meters: [...config.meters, { entity: '', name: 'Sensor', palette: 'mint' }] }); }}>Add percentage sensor</button>` : nothing}
      <h3>On tap</h3><home-overview-popup-editor .hass=${this.hass} .lovelace=${this.lovelace} .value=${this.config.popup} @popup-changed=${(event: CustomEvent<{ value: PopupConfig | undefined }>) => {
        event.stopPropagation(); const config = { ...this.config };
        if (event.detail.value) { config.popup = event.detail.value; delete config.tap_action; }
        else delete config.popup;
        this.emit(config);
      }}></home-overview-popup-editor>${this.config.popup ? nothing : html`<ha-form .hass=${this.hass} .schema=${[select('action', 'Action', ['none', 'navigate', 'more-info']), ...(action.action === 'navigate' ? [text('navigation_path', 'Local path or popup hash')] : []), ...(action.action === 'more-info' ? [entity('entity', 'Entity (optional for room and waste cards)')] : [])]} .data=${action} .computeLabel=${this.label} @value-changed=${this.updateAction}></ha-form>`}
      <details><summary>Appearance overrides</summary><ha-form .hass=${this.hass} .schema=${[
        text('background', 'Light background'), text('background_dark', 'Dark background'), text('accent', 'Light accent'), text('accent_dark', 'Dark accent'), text('icon_background', 'Light icon background'), text('icon_background_dark', 'Dark icon background'), { name: 'border_radius', label: 'Corner radius', selector: { number: { min: 0, max: 48, step: 1, mode: 'box' } } },
      ]} .data=${this.config.appearance || {}} .computeLabel=${this.label} @value-changed=${(event: CustomEvent<{ value: Record<string, unknown> }>) => {
        event.stopPropagation(); const appearance = Object.fromEntries(Object.entries(event.detail.value).filter(([, value]) => value !== '' && value !== undefined && value !== null));
        this.emit({ ...this.config, appearance });
      }}></ha-form></details>`;
  }
}
if (!customElements.get('home-overview-card-editor')) customElements.define('home-overview-card-editor', HomeOverviewCardEditor);
