// Test/demo dependency only. The distributed library never downloads Bubble.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const target = new URL('../.cache/bubble-card.js', import.meta.url);
const expected = '51b54894e51624d8a4596a576ad82b084df69cc7c9473aeaa167f255e01fb396';
const hash = data => createHash('sha256').update(data).digest('hex');
let data = await readFile(target).catch(() => null);
if (!data || hash(data) !== expected) {
  const response = await fetch('https://raw.githubusercontent.com/Clooos/Bubble-Card/v3.4.3/dist/bubble-card.js');
  if (!response.ok) throw new Error(`Bubble Card fixture download failed: ${response.status}`);
  data = Buffer.from(await response.arrayBuffer());
  if (hash(data) !== expected) throw new Error('Bubble Card fixture checksum mismatch');
  await mkdir(new URL('../.cache/', import.meta.url), { recursive: true });
  await writeFile(target, data);
}
console.log('Bubble Card v3.4.3 test/demo fixture verified.');
