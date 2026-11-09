import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { HomeOverviewPopupEditor } from '../../src/popup-editor';
import { HomeOverviewCardEditor } from '../../src/editor';
import type { CardConfig, PopupConfig } from '../../src/types';
afterEach(() => document.body.replaceChildren());
it('enables popups, adds sections and restores a disabled draft', async () => {
  const editor = new HomeOverviewPopupEditor(); document.body.append(editor); await editor.updateComplete;
  await page.getByRole('checkbox', { name: 'Open a popup on tap' }).click();
  expect(editor.value?.hash).toMatch(/^#home-/);
  await page.getByRole('button', { name: 'Add section', exact: true }).click();
  expect(editor.value?.sections).toHaveLength(1);
  const value = editor.value;
  await page.getByRole('checkbox').click(); expect(editor.value).toBeUndefined();
  await page.getByRole('checkbox').click(); expect(editor.value).toEqual(value);
});
it('reorders sections and preserves arbitrary nested card settings', async () => {
  const editor = new HomeOverviewPopupEditor();
  editor.value = { hash: '#bedroom', sections: [{ title: 'Lights', cards: [{ type: 'tile', entity: 'light.room', features: [{ type: 'light-brightness' }] }] }, { title: 'Climate', cards: [] }] };
  document.body.append(editor); await editor.updateComplete;
  await page.getByRole('button', { name: 'Move section 2 up' }).click();
  expect(editor.value.sections[0].title).toBe('Climate'); expect(editor.value.sections[1].cards[0].features).toEqual([{ type: 'light-brightness' }]);
  await page.getByRole('button', { name: 'Remove section 1', exact: true }).click();
  expect(editor.value.sections).toHaveLength(1); expect(editor.value.sections[0].title).toBe('Lights');
});
it('captures nested HA editor changes without replacing the parent card config', async () => {
  const editor = new HomeOverviewCardEditor();
  const popup: PopupConfig = { hash: '#room', sections: [{ title: 'Lights', cards: [] }] };
  editor.setConfig({ type: 'custom:home-room-card', entity: 'sensor.temp', popup, grid_options: { columns: 6 } }); document.body.append(editor); await editor.updateComplete;
  const popupEditor = editor.shadowRoot!.querySelector<HomeOverviewPopupEditor>('home-overview-popup-editor')!; await popupEditor.updateComplete;
  let result: CardConfig | undefined;
  editor.addEventListener('config-changed', e => { result = (e as CustomEvent).detail.config; });
  popupEditor.shadowRoot!.querySelector('hui-card-element-editor')!.dispatchEvent(new CustomEvent('config-changed', { bubbles: true, composed: true, detail: { config: { type: 'vertical-stack', title: 'Room lighting', cards: [{ type: 'tile', entity: 'light.room' }] } } }));
  expect(result?.type).toBe('custom:home-room-card'); expect(result?.popup?.sections[0].cards).toEqual([{ type: 'tile', entity: 'light.room' }]); expect(result?.grid_options).toEqual({ columns: 6 });
  expect(result?.popup?.sections[0].title).toBe('Room lighting');
});
