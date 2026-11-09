/** Shared Bubble styling for popup children without their own explicit styles. */
export function prepareChildCard(input: Record<string, unknown>): Record<string, unknown> {
  const config = structuredClone(input);
  if (['grid', 'horizontal-stack', 'vertical-stack'].includes(String(config.type)) && Array.isArray(config.cards)) {
    config.cards = config.cards.map(card => prepareChildCard(card));
  }
  if (config.type !== 'custom:bubble-card' || config.styles !== undefined) return config;
  let styles = `
    :host {
      --primary-color:var(--hoc-accent);
      --bubble-main-background-color:var(--hoc-bg);
      --bubble-secondary-background-color:var(--hoc-icon-bg);
      --bubble-icon-background-color:var(--hoc-icon-bg);
      --bubble-accent-color:var(--hoc-accent);
      --bubble-sub-button-background-color:var(--hoc-icon-bg);
      color:var(--primary-text-color);
    }
    .bubble-name { font-weight:600; }
    .bubble-icon,.bubble-sub-button { color:var(--hoc-accent) !important; }
  `;
  if (config.card_type === 'button' && ['slider', 'switch'].includes(String(config.button_type))) styles += `
    .bubble-name { white-space:normal !important; line-height:1.2 !important; font-size:14px !important; }
    .bubble-button-card-container { min-height:64px; }
  `;
  if (typeof config.entity === 'string' && /^[a-z_]+\.[a-z0-9_]+$/.test(config.entity) && (config.card_type === 'climate' || config.entity.startsWith('light.'))) {
    const state = `hass.states['${config.entity}']`;
    const active = config.card_type === 'climate' ? `!!${state} && !['off','unknown','unavailable'].includes(${state}.state)` : `${state}?.state === 'on'`;
    const choose = (yes: string, no: string) => '${' + active + ` ? '${yes}' : '${no}'}`;
    styles += `
      .bubble-button-card-container,.bubble-climate-container { box-shadow:${choose('inset 0 0 0 2px var(--primary-color)', 'none')} !important; }
      .bubble-button-background { background:${choose('var(--bubble-secondary-background-color)', 'var(--bubble-main-background-color)')} !important; }
      .bubble-icon-container { background:${choose('var(--primary-color)', 'var(--bubble-secondary-background-color)')} !important; opacity:1 !important; }
      .bubble-icon { color:${choose('var(--bubble-main-background-color)', 'var(--primary-color)')} !important; opacity:1 !important; }
      .bubble-state { color:${choose('var(--primary-text-color)', 'var(--secondary-text-color)')} !important; font-weight:${choose('600', '400')} !important; }
      .bubble-range-fill { background:var(--primary-color) !important; opacity:${choose('0.18', '0')} !important; }
    `;
    if (config.entity.startsWith('light.')) styles += `
      .bubble-sub-button-1 { background:${choose('var(--primary-color)', 'var(--bubble-secondary-background-color)')} !important; }
      .bubble-sub-button-1,.bubble-sub-button-1 ha-icon { color:${choose('var(--bubble-main-background-color)', 'var(--primary-color)')} !important; }
    `;
  }
  config.styles = styles;
  return config;
}
