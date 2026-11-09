import { LitElement, css, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import type { HomeAssistant, PopupConfig, PopupSection } from './types';

/** Uses HA's own stack/card editor for the arbitrary Lovelace child configs. */
export class HomeOverviewPopupEditor extends LitElement {
  static properties = { hass: { attribute: false }, value: { attribute: false }, lovelace: { attribute: false }, revision: { state: true } };
  declare hass: HomeAssistant;
  declare value: PopupConfig | undefined;
  declare lovelace: Record<string, unknown> | undefined;
  private disabledValue?: PopupConfig;
  private revision = 0;
  private sectionOpen = new Map<number, boolean>();
  static styles = css`
    :host { display:block; }
    .enable { display:flex; gap:10px; align-items:center; padding:12px 0; font-weight:500; }
    input { width:20px; height:20px; accent-color:var(--primary-color,#246b9a); }
    input:focus-visible,button:focus-visible,summary:focus-visible { outline:3px solid var(--primary-color,#246b9a); outline-offset:3px; }
    p { color:var(--secondary-text-color); line-height:1.5; }
    details { margin:12px 0; border:1px solid var(--divider-color,#ddd); border-radius:12px; }
    summary { padding:14px; font-weight:600; cursor:pointer; }
    .section-body { padding:0 14px 14px; }
    .toolbar { display:flex; flex-wrap:wrap; gap:8px; margin:12px 0; }
    button { background:none; color:var(--primary-color,#246b9a); border:1px solid currentColor; border-radius:8px; padding:9px 12px; font:inherit; cursor:pointer; }
    button:disabled { opacity:.4; cursor:default; }
    hui-card-element-editor { display:block; margin-top:16px; }
  `;
  private label = (field: { name: string; label?: string }) => field.label || field.name;
  private emit(value: PopupConfig | undefined) {
    this.value = value;
    this.dispatchEvent(new CustomEvent('popup-changed', { bubbles: true, composed: true, detail: { value } }));
  }
  private toggle(event: Event) {
    if ((event.target as HTMLInputElement).checked) {
      this.emit(this.disabledValue || { hash: `#home-${crypto.randomUUID().slice(0, 8)}`, sections: [] });
    } else { this.disabledValue = this.value; this.emit(undefined); }
  }
  private section(index: number, value: PopupSection) {
    if (!this.value) return;
    this.emit({ ...this.value, sections: this.value.sections.map((s, i) => i === index ? value : s) });
  }
  private move(index: number, delta: number) {
    if (!this.value) return;
    const sections = [...this.value.sections];
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    const sourceOpen = this.sectionOpen.get(index) ?? !sections[target].cards.length;
    this.sectionOpen.set(index, this.sectionOpen.get(target) ?? !sections[index].cards.length);
    this.sectionOpen.set(target, sourceOpen);
    this.revision++;
    this.emit({ ...this.value, sections });
  }
  protected render() {
    return html`<label class="enable"><input type="checkbox" .checked=${!!this.value} @change=${this.toggle}>Open a popup on tap</label>${this.value ? html`
      <ha-form .hass=${this.hass} .data=${this.value} .computeLabel=${this.label} .schema=${[
        { name: 'title', label: 'Popup title (defaults to card name)', selector: { text: {} } },
        { name: 'icon', label: 'Popup icon (defaults to card icon)', selector: { icon: {} } },
        { name: 'hash', label: 'Unique popup link, beginning with #', required: true, selector: { text: {} } },
      ]} @value-changed=${(event: CustomEvent<{ value: Record<string, unknown> }>) => {
        event.stopPropagation(); if (!this.value) return;
        const value = { ...this.value };
        for (const key of ['title', 'icon'] as const) { const field = event.detail.value[key]; if (typeof field === 'string' && field) value[key] = field; else delete value[key]; }
        value.hash = String(event.detail.value.hash || ''); this.emit(value);
      }}></ha-form>
      <p>Each section contains ordinary Home Assistant cards. Open a section to configure its heading, columns and cards.</p>
      ${this.value.sections.map((section, index) => keyed(`${this.revision}-${index}`, html`<details @toggle=${(event: Event) => this.sectionOpen.set(index, (event.target as HTMLDetailsElement).open)} .open=${this.sectionOpen.get(index) ?? !section.cards.length}><summary>${section.title || `Section ${index + 1}`} · ${section.cards.length} ${section.cards.length === 1 ? 'card' : 'cards'}</summary><div class="section-body">
        <div class="toolbar"><button aria-label=${`Move section ${index + 1} up`} ?disabled=${index === 0} @click=${() => this.move(index, -1)}>Move up</button><button aria-label=${`Move section ${index + 1} down`} ?disabled=${index === this.value!.sections.length - 1} @click=${() => this.move(index, 1)}>Move down</button><button aria-label=${`Remove section ${index + 1}`} @click=${() => { if (!this.value) return; this.revision++; this.sectionOpen = new Map([...this.sectionOpen].filter(([i]) => i !== index).map(([i, open]) => [i > index ? i - 1 : i, open])); this.emit({ ...this.value, sections: this.value.sections.filter((_, i) => i !== index) }); }}>Remove section</button></div>
        <ha-form .hass=${this.hass} .computeLabel=${this.label} .data=${{ columns: 1, ...section }} .schema=${[
          { name: 'icon', label: 'Section icon', selector: { icon: {} } },
          { name: 'columns', label: 'Columns', selector: { number: { min: 1, max: 2, step: 1, mode: 'box' } } },
        ]} @value-changed=${(event: CustomEvent<{ value: Record<string, unknown> }>) => {
          event.stopPropagation(); const value: PopupSection = { ...section, columns: event.detail.value.columns === 2 ? 2 : 1 };
          const icon = event.detail.value.icon; if (typeof icon === 'string' && icon) value.icon = icon; else delete value.icon;
          this.section(index, value);
        }}></ha-form>
        <hui-card-element-editor .hass=${this.hass} .lovelace=${this.lovelace || { views: [] }} .value=${{ type: 'vertical-stack', title: section.title, cards: section.cards }} @GUImode-changed=${(event: Event) => event.stopPropagation()} @config-changed=${(event: CustomEvent<{ config: { title?: string; cards?: Record<string, unknown>[] } }>) => {
          event.stopPropagation();
          if (Array.isArray(event.detail.config?.cards)) this.section(index, { ...section, title: event.detail.config.title || undefined, cards: event.detail.config.cards });
        }}></hui-card-element-editor>
      </div></details>`))}
      <button @click=${() => { if (this.value) this.emit({ ...this.value, sections: [...this.value.sections, { title: 'New section', columns: 1, cards: [] }] }); }}>Add section</button>
    ` : nothing}`;
  }
}
if (!customElements.get('home-overview-popup-editor')) customElements.define('home-overview-popup-editor', HomeOverviewPopupEditor);
