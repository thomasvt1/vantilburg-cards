export type PreviewMode = 'card' | 'popup';
const modes = new WeakMap<Node, PreviewMode>();

// HA recreates the preview card on every draft change. Keep this UI-only choice
// on the surrounding editor's lifetime, never in the saved Lovelace config.
export function previewOwner(element: HTMLElement): Node | undefined {
  let node: Node | null = element;
  while (node) {
    if (node instanceof HTMLElement && ['hui-dialog-edit-card', 'hui-dialog-create-card'].includes(node.localName)) return node;
    node = node.parentNode || (node instanceof ShadowRoot ? node.host : null);
  }
  return undefined;
}
export function previewMode(element: HTMLElement): PreviewMode { const owner = previewOwner(element); return owner ? modes.get(owner) || 'card' : 'card'; }
export function setPreviewMode(element: HTMLElement, mode: PreviewMode) { const owner = previewOwner(element); if (owner) modes.set(owner, mode); }
