import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { palettes } from './appearance';
import { validateConfig } from './config';
import { language, words } from './data';
import type { CardConfig, HomeAssistant, Palette } from './types';
import type { HomeOverviewPopup } from './popup';
import './popup';
import { previewMode, previewOwner, setPreviewMode, type PreviewMode } from './preview-state';

export abstract class BaseCard extends LitElement {
  static properties = { hass: { attribute: false }, config: { state: true }, preview: { type: Boolean } };
  preview = false;
  declare hass: HomeAssistant;
  protected config!: CardConfig;
  static styles = css`
    :host { display:block; height:100%; --hoc-radius:18px; }
    :host([editor-preview]) { height:auto; align-self:start; }
    :host([editor-preview]) ha-card { height:auto; }
    * { box-sizing:border-box; }
    ha-card { display:block; height:100%; border:0; border-radius:var(--hoc-radius); background:var(--hoc-bg); color:var(--primary-text-color,#17212c); box-shadow:none; overflow:hidden; }
    button,.surface { appearance:none; border:0; background:none; color:inherit; font:inherit; text-align:left; width:100%; margin:0; padding:16px; border-radius:inherit; }
    button { cursor:pointer; }
    button:hover { background:color-mix(in srgb,var(--hoc-accent) 7%,transparent); }
    button:active { background:color-mix(in srgb,var(--hoc-accent) 13%,transparent); }
    button:focus-visible { outline:3px solid var(--hoc-accent); outline-offset:-3px; }
    ::selection { background:var(--hoc-icon-bg); color:var(--primary-text-color,#17212c); }
    .row { display:grid; grid-template-columns:44px minmax(0,1fr) 14px; align-items:center; gap:12px; }
    .badge { width:44px; height:44px; border-radius:50%; background:var(--hoc-icon-bg); color:var(--hoc-accent); display:grid; place-items:center; }
    ha-icon { --mdc-icon-size:25px; width:25px; height:25px; display:inline-flex; }
    .name { font-size:16px; font-weight:600; line-height:1.3; overflow-wrap:anywhere; }
    .value { font-size:13px; line-height:1.45; margin-top:5px; overflow-wrap:anywhere; font-variant-numeric:tabular-nums; }
    .secondary { color:var(--secondary-text-color,#526170); }
    .arrow { color:var(--hoc-accent); width:14px; height:24px; }
    .room { height:100%; min-height:104px; padding:14px 10px; }
    .room .row { min-height:76px; grid-template-columns:40px minmax(0,1fr) 10px; gap:8px; }
    .room .badge { width:40px; height:40px; }
    .room ha-icon { --mdc-icon-size:24px; width:24px; height:24px; }
    .room .name { font-size:13px; font-weight:500; }
    .room .value { font-size:23px; font-weight:600; line-height:1.2; margin-top:4px; }
    .room .value.small { font-size:14px; line-height:1.35; }
    .bars { display:flex; gap:16px; margin-top:16px; }
    .track { flex:1; height:6px; border-radius:8px; background:var(--meter-track); overflow:hidden; }
    .fill { height:100%; border-radius:inherit; background:var(--meter-fill); }
    .track.unavailable { opacity:.55; }
    .power { container-type:inline-size; }
    .power .value:not(.small) { white-space:nowrap; overflow-wrap:normal; font-size:clamp(17px,12cqi,23px); }
    .room .value .sub { display:block; white-space:normal; font-size:13px; font-weight:400; line-height:1.4; margin-top:2px; color:var(--secondary-text-color,#526170); }
    .energy-head { display:grid; grid-template-columns:44px minmax(0,1fr) auto; align-items:center; gap:12px; }
    .energy-head.action { grid-template-columns:44px minmax(0,1fr) auto 14px; }
    .total { font-size:23px; font-weight:600; line-height:1.2; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .total.small { font-size:14px; font-weight:400; color:var(--secondary-text-color,#526170); }
    .share { display:block; flex:none; margin-top:14px; }
    .devices { list-style:none; margin:10px 0 0; padding:0; display:grid; gap:2px; }
    .devices li { display:flex; justify-content:space-between; align-items:center; gap:12px; min-height:28px; font-size:14px; line-height:1.35; }
    .devices .device-name { min-width:0; overflow-wrap:anywhere; }
    .devices .reading { font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .devices .idle .reading { font-weight:400; color:var(--secondary-text-color,#526170); }
    button.history { display:inline; width:auto; margin:0 -4px; padding:0 4px; border-radius:6px; text-align:inherit; }
    .room .value .sub.history { display:block; width:fit-content; margin-top:2px; }
    .devices button.history { flex:none; display:flex; justify-content:space-between; align-items:center; gap:12px; width:calc(100% + 16px); min-height:28px; margin:0 -8px; padding:0 8px; border-radius:8px; }
    .over-limit { color:color-mix(in srgb,#d93025 72%,var(--primary-text-color,#17212c)); font-weight:600; }
    button.history:focus-visible { outline:2px solid var(--hoc-accent); outline-offset:1px; }
    .preview-switch { display:flex; gap:4px; margin-bottom:12px; padding:4px; border:1px solid var(--divider-color,#ddd); border-radius:12px; }
    .preview-switch button { width:auto; flex:1; min-height:40px; padding:8px 12px; text-align:center; border-radius:8px; color:var(--primary-text-color,#17212c); }
    .preview-switch button[aria-pressed="true"] { background:var(--hoc-icon-bg); color:var(--hoc-accent); font-weight:600; }
    @media (prefers-reduced-motion:no-preference) { button { transition:background 120ms ease-out; } }
  `;
  setConfig(config: CardConfig) { validateConfig(config); this.config = structuredClone(config); }
  static getConfigElement() { return document.createElement('home-overview-card-editor'); }
  /** Height in 50px units, which masonry views use to balance their columns. */
  getCardSize() { return 2; }
  private get editorPreview() { return this.preview && !!previewOwner(this); }
  getGridOptions() { return { columns: this.editorPreview && this.config?.popup && previewMode(this) === 'popup' ? 12 : ['custom:home-room-card', 'custom:home-power-card'].includes(this.config?.type) ? 6 : 12, rows: 'auto', min_columns: 3 }; }
  private changePreview(mode: PreviewMode) {
    setPreviewMode(this, mode);
    this.requestUpdate();
    this.dispatchEvent(new Event('card-updated', { bubbles: true, composed: true }));
  }
  protected get t() { return words[language(this.hass || { states: {} }, this.config?.language)]; }
  protected get dark() { return !!this.hass?.themes?.darkMode; }
  protected colors(palette: Palette) { return palettes[palette][this.dark ? 'dark' : 'light']; }
  protected abstract content(): unknown;
  protected abstract get defaultPalette(): Palette;
  /** Popup heading when the card has no name. */
  protected abstract get defaultName(): string;
  /** Entities shown on the summary card. Popup children receive hass separately. */
  protected abstract entityIds(): (string | undefined)[];
  // HA replaces hass on every state change anywhere in the house. Re-render only
  // for changes this card shows; still forward hass so popup children stay live.
  protected shouldUpdate(changed: PropertyValues) {
    const old = changed.get('hass') as HomeAssistant | undefined;
    if (changed.size !== 1 || !old || !this.hass || !this.config) return true;
    const hass = this.hass;
    const relevant = old.themes !== hass.themes || old.locale !== hass.locale || old.language !== hass.language || old.config !== hass.config
      || this.entityIds().some(id => id && old.states[id] !== hass.states[id]);
    if (relevant) return true;
    const popup = this.renderRoot.querySelector<HomeOverviewPopup>('home-overview-popup');
    if (popup) popup.hass = hass;
    return false;
  }
  protected render() {
    if (!this.config) return nothing;
    this.toggleAttribute('editor-preview', this.editorPreview);
    const [bg, iconBg, accent] = this.colors(this.config.palette ?? this.defaultPalette);
    const appearance = this.config.appearance || {};
    const select = (light: string | undefined, dark: string | undefined, fallback: string) => (this.dark ? dark : light) || fallback;
    this.style.setProperty('--hoc-bg', select(appearance.background, appearance.background_dark, bg));
    this.style.setProperty('--hoc-icon-bg', select(appearance.icon_background, appearance.icon_background_dark, iconBg));
    this.style.setProperty('--hoc-accent', select(appearance.accent, appearance.accent_dark, accent));
    this.style.setProperty('--hoc-radius', `${appearance.border_radius ?? 18}px`);
    this.style.colorScheme = this.dark ? 'dark' : 'light';
    const showPopup = this.editorPreview && this.config.popup && previewMode(this) === 'popup';
    return html`${this.editorPreview && this.config.popup ? html`<div class="preview-switch" role="group" aria-label="Preview"><button type="button" aria-pressed=${!showPopup} @click=${() => this.changePreview('card')}>Card</button><button type="button" aria-pressed=${!!showPopup} @click=${() => this.changePreview('popup')}>Popup</button></div>` : nothing}
      ${showPopup ? nothing : html`<ha-card>${this.content()}</ha-card>`}
      ${this.config.popup && (!this.preview || showPopup) ? html`<home-overview-popup .inline=${this.preview} .config=${this.config.popup} .hass=${this.hass} .title=${this.config.name || this.defaultName} .icon=${this.config.icon || 'mdi:home-outline'}></home-overview-popup>` : nothing}`;
  }
  protected shell(body: unknown, className = '') {
    return this.actionable
      ? html`<button class=${className} @click=${this.activate}>${body}</button>`
      : html`<div class=${`surface ${className}`}>${body}</div>`;
  }
  protected row(name: string, icon: string, value: unknown, small = false, secondary = false) {
    return html`<div class="row"><span class="badge" aria-hidden="true"><ha-icon .icon=${icon}></ha-icon></span><div><div class="name">${name}</div><div class=${`value ${small ? 'small' : ''} ${secondary ? 'secondary' : ''}`}>${value}</div></div>${this.arrow()}</div>`;
  }
  /**
   * A reading that opens its sensor's more-info dialog with history. A card with its own
   * tap action or popup is already one button, so its readings stay plain text there,
   * as they do in the noninteractive editor preview.
   */
  protected history(entityId: string | undefined, body: unknown, className = '') {
    if (!entityId || this.actionable || this.preview) return className ? html`<span class=${className}>${body}</span>` : body;
    return html`<button type="button" class=${`history ${className}`} @click=${() => this.moreInfo(entityId)}>${body}</button>`;
  }
  private moreInfo(entityId: string) {
    this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId } }));
  }
  protected get actionable() { return !!this.config.popup || !!this.config.tap_action && this.config.tap_action.action !== 'none'; }
  protected arrow() {
    return this.actionable ? html`<svg class="arrow" viewBox="0 0 16 24" aria-hidden="true"><path d="m5 8 4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>` : nothing;
  }
  private activate() {
    if (this.preview) { if (this.editorPreview && this.config.popup) this.changePreview('popup'); return; }
    if (this.config.popup) { this.shadowRoot?.querySelector<HomeOverviewPopup>('home-overview-popup')?.open(); return; }
    const action = this.config.tap_action;
    if (action?.action === 'navigate') {
      history.pushState(null, '', action.navigation_path);
      window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
    } else if (action?.action === 'more-info') {
      const entityId = action.entity || ('entity' in this.config ? this.config.entity : undefined);
      if (typeof entityId === 'string' && entityId) this.moreInfo(entityId);
    }
  }
}
