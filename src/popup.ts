import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import type { CardElement, CardHelpers, HomeAssistant, PopupConfig } from './types';
import { prepareChildCard } from './child-cards';
import { bubblePopupConfig } from './bubble-popup';

declare global { interface Window { loadCardHelpers?: () => Promise<CardHelpers> } }

/** Composes existing Lovelace cards; it never owns their device-control logic. */
export class HomeOverviewPopup extends LitElement {
  static properties = { config: { attribute: false }, hass: { attribute: false }, title: { type: String }, icon: { type: String }, inline: { type: Boolean, reflect: true }, error: { state: true }, childrenReady: { state: true } };
  inline = false;
  declare config: PopupConfig;
  declare hass: HomeAssistant;
  title = '';
  icon = 'mdi:home-outline';
  private error = '';
  private childrenReady = false;
  private cards: CardElement[][] = [];
  private generation = 0;
  private bubble?: CardElement;
  private portal?: HTMLElement;
  private bubbleSignature = '';
  private loading?: Promise<void>;
  private attemptedOpen = false;
  private cardConfig?: PopupConfig;
  static styles = css`
    :host { display:contents; }
    * { box-sizing:border-box; }
    :host([inline]) { display:block; min-width:0; }
    .inline-preview { border-radius:28px; background:var(--primary-background-color,#fafafa); color:var(--primary-text-color,#17212c); overflow:hidden; width:100%; }
    .inline-preview header { position:static; }
    .close-placeholder { width:44px; height:44px; display:grid; place-items:center; flex:none; }
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
    @media(max-width:600px) { header { padding:16px 18px; } }
  `;
  connectedCallback() {
    super.connectedCallback();
    void customElements.whenDefined('bubble-card').then(() => { if (this.isConnected && !this.inline) void this.ensureBubble(); });
    void this.updateComplete.then(() => { if (this.isConnected && !this.inline) void this.ensureBubble(); });
  }
  disconnectedCallback() {
    super.disconnectedCallback(); this.generation++;
    if (!this.childrenReady) this.cardConfig = undefined;
    this.removeBubble();
  }
  protected updated(changed: PropertyValues) {
    if (changed.has('hass')) for (const section of this.cards) for (const card of section) card.hass = this.hass;
    if (this.inline) {
      this.removeBubble();
      if (this.cardConfig !== this.config && this.config) void this.loadCards();
      return;
    }
    // Rebuilding the Bubble config resolves computed styles and serializes every
    // child; plain state updates only need to reach Bubble, which forwards them.
    const themeChanged = changed.has('hass') && (changed.get('hass') as HomeAssistant | undefined)?.themes !== this.hass?.themes;
    if (!this.bubble || themeChanged || changed.has('config') || changed.has('title') || changed.has('icon')) void this.ensureBubble();
    else if (changed.has('hass')) this.bubble.hass = this.hass;
  }
  async open() {
    if (!this.config || this.inline) return;
    this.attemptedOpen = true;
    await this.ensureBubble();
    if (!this.bubble || !this.isConnected || this.inline) { this.requestUpdate(); return; }
    if (location.hash !== this.config.hash) {
      history.pushState(null, '', this.config.hash);
      window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
    }
  }
  private removeBubble() {
    this.portal?.remove(); this.portal = undefined; this.bubble = undefined; this.bubbleSignature = '';
  }
  private async ensureBubble() {
    if (!this.isConnected || !this.config || this.inline || !this.hass) return;
    if (!customElements.get('bubble-card')) {
      this.error = 'Install Bubble Card 3.4.3 or newer through HACS, then reload the dashboard to use popups.';
      return;
    }
    // A load abandoned by a disconnect leaves no bubble; a reconnect must retry it.
    while (this.loading) await this.loading;
    if (!this.isConnected || this.inline) return;
    if (!this.bubble) {
      const generation = this.generation;
      const loading = this.loading = (async () => {
        try {
          if (!window.loadCardHelpers) throw new Error('Home Assistant card helpers are not available. Reload the dashboard.');
          const helpers = await window.loadCardHelpers();
          if (generation !== this.generation || !this.isConnected || this.inline) return;
          // Bubble suspends the nearest HA layout cell when closed. A separate
          // portal gives it its own host, so it never hides the summary card.
          this.portal = document.createElement('div');
          this.portal.dataset.vantilburgPopup = this.config.hash;
          this.portal.style.display = 'contents';
          const config = this.runtimeConfig();
          this.bubble = helpers.createCardElement(config);
          this.bubbleSignature = JSON.stringify(config);
          this.bubble.hass = this.hass;
          this.portal.append(this.bubble);
          // Keep composed child events (e.g. hass-more-info) inside HA's app.
          (document.querySelector('home-assistant')?.shadowRoot ?? document.body).append(this.portal);
          this.error = '';
        } catch (error) { this.error = error instanceof Error ? error.message : 'Could not load Bubble Card.'; this.removeBubble(); }
      })();
      try { await loading; } finally { if (this.loading === loading) this.loading = undefined; }
    }
    if (this.bubble) {
      const config = this.runtimeConfig(), signature = JSON.stringify(config);
      if (signature !== this.bubbleSignature) { this.bubble.setConfig(config); this.bubbleSignature = signature; }
      this.bubble.hass = this.hass;
    }
  }
  private runtimeConfig() {
    const style = getComputedStyle(this);
    // Resolve inherited variables before leaving the card's shadow tree.
    const names = ['--hoc-bg', '--hoc-icon-bg', '--hoc-accent', '--primary-background-color', '--primary-text-color', '--secondary-text-color', '--divider-color', '--paper-font-body1_-_font-family'];
    const theme = `:host { ${names.map(name => `${name}:${style.getPropertyValue(name)};`).join('')} color-scheme:${this.hass.themes?.darkMode ? 'dark' : 'light'}; }`;
    return bubblePopupConfig(this.config, this.title, this.icon, theme);
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
        if (this.inline) { card.preview = true; card.editMode = true; }
        card.hass = this.hass;
        return card;
      }));
      this.childrenReady = true;
    } catch (error) { if (generation === this.generation) this.error = error instanceof Error ? error.message : 'Could not load cards.'; }
  }
  protected render() {
    if (!this.config) return nothing;
    if (this.inline) return html`<div class="inline-preview" role="region" aria-label=${`${this.config.title || this.title} popup preview`}>${this.renderContent()}</div>`;
    return this.attemptedOpen && this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing;
  }
  private renderContent() {
    const closeIcon = html`<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
    return html`<header><span class="badge" aria-hidden="true"><ha-icon .icon=${this.config.icon || this.icon}></ha-icon></span><h2 id="popup-title">${this.config.title || this.title}</h2><span class="close-placeholder" aria-hidden="true">${closeIcon}</span></header><main>${this.error ? html`<p class="error" role="alert">${this.error}</p>` : !this.childrenReady ? html`<p role="status">Loading…</p>` : this.config.sections.map((section, i) => html`<section>${section.title ? html`<div class="heading">${section.icon ? html`<ha-icon .icon=${section.icon} aria-hidden="true"></ha-icon>` : nothing}<h3>${section.title}</h3><span class="line" aria-hidden="true"></span></div>` : nothing}<div class="cards" inert style=${`--columns:${section.columns || 1}`}>${this.cards[i]?.map(card => html`<div class="child">${card}</div>`)}</div></section>`)}</main>`;
  }
}
if (!customElements.get('home-overview-popup')) customElements.define('home-overview-popup', HomeOverviewPopup);
