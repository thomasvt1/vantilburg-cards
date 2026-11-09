/** Real pinned Bubble Card, loaded only by development fixtures. */
export async function loadBubbleFixture() {
  if (customElements.get('bubble-card')) return;
  const script = document.createElement('script');
  script.src = new URL('../../.cache/bubble-card.js', import.meta.url).href;
  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve(); script.onerror = () => reject(new Error('Run npm run fetch:bubble to load the demo dependency.'));
    document.head.append(script);
  });
  await customElements.whenDefined('bubble-card');
}
