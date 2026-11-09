import { prepareChildCard } from './child-cards';
import type { PopupConfig } from './types';

/** Public Bubble configuration only: Bubble owns the modal and its lifecycle. */
export function bubblePopupConfig(config: PopupConfig, title: string, icon: string, theme: string) {
  const cards: Record<string, unknown>[] = [];
  for (const section of config.sections) {
    if (section.title) cards.push(prepareChildCard({ type: 'custom:bubble-card', card_type: 'separator', name: section.title, ...(section.icon ? { icon: section.icon } : {}) }));
    const children = section.cards.map(prepareChildCard);
    if (section.columns === 2) cards.push({ type: 'grid', columns: 2, square: false, cards: children });
    else cards.push(...children);
  }
  return {
    type: 'custom:bubble-card', card_type: 'pop-up', hash: config.hash,
    name: config.title || title, icon: config.icon || icon, button_type: 'name',
    bg_color: 'var(--primary-background-color)', bg_opacity: '100',
    width_desktop: '560px', margin_top_mobile: '56px', margin_top_desktop: '64px',
    styles: `${theme}
      :host {
        --primary-color:var(--hoc-accent);
        --bubble-main-background-color:var(--hoc-bg);
        --bubble-secondary-background-color:var(--hoc-icon-bg);
        --bubble-icon-background-color:var(--hoc-icon-bg);
        --bubble-accent-color:var(--hoc-accent);
        --bubble-sub-button-background-color:var(--hoc-icon-bg);
        --bubble-pop-up-main-background-color:var(--primary-background-color);
        --bubble-pop-up-background-color:var(--primary-background-color);
        --bubble-pop-up-border-radius:28px;
        color:var(--primary-text-color);
      }
      .bubble-name { font-weight:600; }
      .bubble-icon,.bubble-sub-button { color:var(--hoc-accent) !important; }
    `,
    cards,
  };
}
