import { xoshiro128ss, teachingSeed } from './seeded.mjs';
/** Same declared seed, separate fixed 1000-word blocks. Not real sampling evidence. */
export function teachingWordBlocks(count = 200, seed = teachingSeed) {
  if (!Number.isInteger(count) || count < 1 || count > 200) throw new RangeError('1–200 blocks required');
  const next = xoshiro128ss(seed);
  return Array.from({ length: count }, () => Array.from({ length: 1000 }, () => next()));
}
/** Fisher–Yates; rejection removes modulo bias under ideal uniform uint32 draws. */
export function shuffledIndices(size, words) {
  if (!Number.isInteger(size) || size < 1 || size > 100 || !Array.isArray(words) || words.some(w => !Number.isInteger(w) || w < 0 || w > 0xffffffff)) throw new RangeError('Size1–100 and uint32 words required');
  const indices = Array.from({ length: size }, (_, i) => i); let consumed = 0;
  for (let end = size - 1; end > 0; end--) {
    const bound = end + 1, limit = Math.floor(2 ** 32 / bound) * bound; let word;
    do { if (consumed >= words.length) throw new RangeError('Fixed block exhausted'); word = words[consumed++]; } while (word >= limit);
    const selected = word % bound; [indices[end], indices[selected]] = [indices[selected], indices[end]];
  }
  return { indices, consumed };
}
/** Mathematical Box–Muller cosine transform, finite 32-bit input grid. */
export function normalFromWords(radial, angular) {
  if ([radial, angular].some(w => !Number.isInteger(w) || w < 0 || w > 0xffffffff)) throw new RangeError('Two uint32 words required');
  const u = 1 - radial / 2 ** 32, v = angular / 2 ** 32;
  return radial === 0 ? 0 : Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
