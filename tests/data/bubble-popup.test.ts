import { expect, it } from 'vitest';
import { bubblePopupConfig } from '../../src/bubble-popup';

it('compiles sections to native Bubble separators and regular Lovelace cards', () => {
  const popup = { hash: '#room', sections: [
    { title: 'Scenes', icon: 'mdi:sun', columns: 2 as const, cards: [{ type: 'button', entity: 'scene.evening' }] },
    { title: 'Lights', cards: [{ type: 'custom:bubble-card', card_type: 'button', styles: 'explicit override' }] },
  ] };
  const original = structuredClone(popup);
  const result = bubblePopupConfig(popup, 'Room', 'mdi:sofa', ':host { --hoc-accent:blue; }');
  expect(result).toMatchObject({ type: 'custom:bubble-card', card_type: 'pop-up', hash: '#room', name: 'Room', width_desktop: '560px', margin_top_mobile: '56px', margin_top_desktop: '64px' });
  expect(result.cards).toMatchObject([
    { type: 'custom:bubble-card', card_type: 'separator', name: 'Scenes', icon: 'mdi:sun' },
    { type: 'grid', columns: 2, square: false, cards: [{ type: 'button', entity: 'scene.evening' }] },
    { type: 'custom:bubble-card', card_type: 'separator', name: 'Lights' },
    { type: 'custom:bubble-card', card_type: 'button', styles: 'explicit override' },
  ]);
  expect(popup).toEqual(original);
});

it('preserves header overrides and untitled sections without extra wrappers', () => {
  const result = bubblePopupConfig({ hash: '#room', title: 'Custom', icon: 'mdi:bed', sections: [{ cards: [{ type: 'entities', entities: ['light.room'] }] }] }, 'Room', 'mdi:sofa', '');
  expect(result.name).toBe('Custom'); expect(result.icon).toBe('mdi:bed');
  expect(result.cards).toEqual([{ type: 'entities', entities: ['light.room'] }]);
});
