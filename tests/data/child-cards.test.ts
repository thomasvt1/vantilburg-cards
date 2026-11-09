import { expect, it } from 'vitest';
import { prepareChildCard } from '../../src/child-cards';
it('preserves explicit styles and actions without mutating configuration', () => {
  const input = { type: 'custom:bubble-card', styles: 'custom css', tap_action: { action: 'toggle' } };
  const result = prepareChildCard(input);
  expect(result).toEqual(input); expect(result).not.toBe(input);
});
it('themes cards inside supported stacks while leaving other cards alone', () => {
  const input = { type: 'grid', cards: [{ type: 'custom:bubble-card', card_type: 'button', entity: 'light.room', button_type: 'slider' }, { type: 'tile', entity: 'light.room' }] };
  const result = prepareChildCard(input);
  const cards = result.cards as Record<string, unknown>[];
  expect(cards[0].styles).toContain('var(--hoc-accent)'); expect(cards[0].styles).toContain("hass.states['light.room']");
  expect(cards[1]).toEqual(input.cards[1]); expect(input.cards[0]).not.toHaveProperty('styles');
});
it('does not interpolate malformed entity strings into Bubble expressions', () => {
  const result = prepareChildCard({ type: 'custom:bubble-card', card_type: 'climate', entity: "climate.x'];evil()" });
  expect(result.styles).not.toContain('evil');
});
