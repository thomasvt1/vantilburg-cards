import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import type { CardElement, CardHelpers, HomeAssistant, PopupConfig } from './types';
import { prepareChildCard } from './child-cards';

declare global { interface Window { loadCardHelpers?: () => Promise<CardHelpers> } }

/** Composes existing Lovelace cards; it never owns their device-control logic. */
export class HomeOverviewPopup extends LitElement {
  static properties = { config: { attribute: false }, hass: { attribute: false }, title: { type: String }, icon: { type: String }, error: { state: true }, childrenReady: { state: true } };
  declare config: PopupConfig;
  declare hass: HomeAssistant;
  title = '';
  icon = 'mdi:home-outline';
  private error = '';
  private childrenReady = false;
  private cards: CardElement[][] = [];
  private generation = 0;
  private opener?: HTMLElement;
  private pushed = false;
  private cardConfig?: PopupConfig;
  private readonly syncLocation = () => this.syncDialog();
  static styles = css`
    :host { display:contents; }
    * { box-sizing:border-box; }
    dialog { border:0; border-radius:28px; padding:0; width:min(560px,calc(100vw - 24px)); max-height:calc(100dvh - 64px); margin:32px auto; background:var(--primary-background-color,#fafafa); color:var(--primary-text-color,#17212c); box-shadow:0 16px 48px #0003; overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; scrollbar-color:var(--hoc-icon-bg) transparent; }
    dialog::backdrop { background:#0005; }
    header { display:flex; align-items:center; gap:12px; padding:24px 24px 16px; position:sticky; top:0; z-index:1; background:var(--primary-background-color,#fafafa); }
    .badge { display:grid; place-items:center; border-radius:50%; width:42px; height:42px; background:var(--hoc-icon-bg); color:var(--hoc-accent); flex:none; }
    h2 { font:600 15px/1.35 var(--paper-font-body1_-_font-family,Roboto,system-ui,sans-serif); margin:0; flex:1; overflow-wrap:anywhere; }
    button { border:0; background:none; color:inherit; width:44px; height:44px; display:grid; place-items:center; border-radius:50%; cursor:pointer; }
    button:hover { background:var(--hoc-icon-bg); }
    button:focus-visible { outline:3px solid var(--hoc-accent); outline-offset:2px; }
    ha-icon { --mdc-icon-size:24px; width:24px; height:24px; }
    main { padding:0 18px 24px; }
    section + section { margin-top:22px; }
    .heading { display:flex; align-items:center; gap:16px; margin:12px 8px 16px; }
    .heading ha-icon { color:var(--hoc-accent); }
    h3 { font-size:16px; line-height:1.3; font-weight:600; margin:0; overflow-wrap:anywhere; }
    .line { height:5px; border-radius:5px; background:var(--divider-color,#eee); flex:1; min-width:24px; }
    .cards { display:grid; grid-template-columns:repeat(var(--columns,1),minmax(0,1fr)); gap:8px; }
    .child { min-width:0; --primary-color:var(--hoc-accent); --ha-card-background:var(--hoc-bg); --card-background-color:var(--hoc-bg); --ha-card-border-width:0; --ha-card-border-radius:18px; --bubble-main-background-color:var(--hoc-bg); --bubble-secondary-background-color:var(--hoc-icon-bg); --bubble-icon-background-color:var(--hoc-icon-bg); --bubble-accent-color:var(--hoc-accent); --bubble-sub-button-background-color:var(--hoc-icon-bg); }
    .error { padding:16px; }
    ::selection { background:var(--hoc-icon-bg); }
    @media(max-width:600px) { dialog { margin:16px auto; max-height:calc(100dvh - 32px); } header { padding:16px 18px; } }
  `;
  connectedCallback() {
    super.connectedCallback();
    for (const event of ['location-changed', 'popstate', 'hashchange']) window.addEventListener(event, this.syncLocation);
    void this.updateComplete.then(() => this.syncDialog());
  }
  disconnectedCallback() {
    super.disconnectedCallback(); this.generation++;
    if (!this.childrenReady) this.cardConfig = undefined;
    for (const event of ['location-changed', 'popstate', 'hashchange']) window.removeEventListener(event, this.syncLocation);
    this.shadowRoot?.querySelector('dialog')?.close();
  }
  protected updated(changed: PropertyValues) {
    if (changed.has('hass')) for (const section of this.cards) for (const card of section) card.hass = this.hass;
    this.syncDialog();
  }
  open() {
    if (!this.config) return;
    this.opener = this.getRootNode() instanceof ShadowRoot ? (this.getRootNode() as ShadowRoot).activeElement as HTMLElement : document.activeElement as HTMLElement;
    if (location.hash !== this.config.hash) {
      history.pushState({ ...history.state, homeOverviewPopup: this.config.hash }, '', this.config.hash);
      this.pushed = true;
      window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
    }
    this.syncDialog();
  }
  private close() {
    this.shadowRoot?.querySelector('dialog')?.close();
    if (location.hash === this.config?.hash) {
      if (this.pushed && history.state?.homeOverviewPopup === this.config.hash) history.back();
      else {
        history.replaceState(history.state, '', location.pathname + location.search);
        window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: true } }));
      }
    }
    this.pushed = false;
    this.opener?.focus();
  }
  private syncDialog() {
    if (!this.isConnected || !this.config) return;
    const dialog = this.shadowRoot?.querySelector('dialog');
    if (!dialog) return;
    const shouldOpen = location.hash === this.config.hash;
    if (shouldOpen && !dialog.open) {
      // Save focus even for hash navigation initiated outside this card.
      if (!this.opener) this.opener = document.activeElement as HTMLElement;
      dialog.showModal();
    } else if (!shouldOpen && dialog.open) { dialog.close(); this.opener?.focus(); }
    if (shouldOpen && this.cardConfig !== this.config) void this.loadCards();
  }
  private async loadCards() {
    const generation = ++this.generation;
    this.cardConfig = this.config;
    this.childrenReady = false;
    this.error = '';
    try {
      if (!window.loadCardHelpers) throw new Error('Home Assistant card helpers are not available. Reload the dashboard.');
      const helpers = await window.loadCardHelpers();
      if (generation !== this.generation || !this.isConnected) return;
      this.cards = this.config.sections.map(section => section.cards.map(config => {
        const card = helpers.createCardElement(prepareChildCard(config));
        card.hass = this.hass;
        return card;
      }));
      this.childrenReady = true;
    } catch (error) { if (generation === this.generation) this.error = error instanceof Error ? error.message : 'Could not load cards.'; }
  }
  protected render() {
    if (!this.config) return nothing;
    return html`<dialog aria-labelledby="popup-title" @cancel=${(e: Event) => { e.preventDefault(); this.close(); }} @click=${(e: MouseEvent) => {
      if (e.target === e.currentTarget) { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) this.close(); }
    }}><header><span class="badge" aria-hidden="true"><ha-icon .icon=${this.config.icon || this.icon}></ha-icon></span><h2 id="popup-title">${this.config.title || this.title}</h2><button aria-label=${this.hass?.language?.startsWith('nl') ? 'Sluiten' : 'Close'} @click=${this.close}><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></header><main>${this.error ? html`<p class="error" role="alert">${this.error}</p>` : !this.childrenReady ? html`<p role="status">Loading…</p>` : this.config.sections.map((section, i) => html`<section>${section.title ? html`<div class="heading">${section.icon ? html`<ha-icon .icon=${section.icon} aria-hidden="true"></ha-icon>` : nothing}<h3>${section.title}</h3><span class="line" aria-hidden="true"></span></div>` : nothing}<div class="cards" style=${`--columns:${section.columns || 1}`}>${this.cards[i]?.map(card => html`<div class="child">${card}</div>`)}</div></section>`)}</main></dialog>`;
  }
}
if (!customElements.get('home-overview-popup')) customElements.define('home-overview-popup', HomeOverviewPopup);
