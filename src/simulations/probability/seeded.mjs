// Authored JavaScript port of xoshiro128** 1.1 by Blackman/Vigna (2018).
// Algorithm source: https://prng.di.unimi.it/xoshiro128starstar.c (public domain).
// Deterministic teaching records, not cryptographic or real surveyed observations.
export const teachingSeed = Object.freeze([0x9e3779b9, 0x243f6a88, 0xb7e15162, 0xdeadbeef]);
export function xoshiro128ss(seed = teachingSeed) {
  if (!Array.isArray(seed) || seed.length !== 4 || seed.some(n => !Number.isInteger(n) || n < 0 || n > 0xffffffff) || seed.every(n => n === 0)) throw new RangeError('Four uint32 state words, not all zero, required');
  const state = seed.slice(), rotate = (x, k) => ((x << k) | (x >>> (32 - k))) >>> 0;
  return () => {
    const result = Math.imul(rotate(Math.imul(state[1], 5), 7), 9) >>> 0, shift = state[1] << 9;
    state[2] = (state[2] ^ state[0]) >>> 0; state[3] = (state[3] ^ state[1]) >>> 0;
    state[1] = (state[1] ^ state[2]) >>> 0; state[0] = (state[0] ^ state[3]) >>> 0;
    state[2] = (state[2] ^ shift) >>> 0; state[3] = rotate(state[3], 11);
    return result;
  };
}
export function fixedBlock(sampleIndex = 0, size = 1000, seed = teachingSeed) {
  if (!Number.isInteger(sampleIndex) || sampleIndex < 0 || sampleIndex > 199 || !Number.isInteger(size) || size < 0 || size > 1000) throw new RangeError('Sample index0–199 and prefix size0–1000 required');
  const next = xoshiro128ss(seed);
  for (let i = 0; i < sampleIndex * 1000; i++) next();
  return Array.from({ length: size }, () => next() / 2 ** 32);
}
