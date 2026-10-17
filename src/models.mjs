// Educational idealized models, not hardware benchmarks.
export function parallelTime(fraction, units, baseline = 10) {
  return baseline * (1 - fraction + fraction / units);
}
export function transferTime(sizeMB, bandwidthGBs) {
  return (sizeMB / (bandwidthGBs * 1000)) * 1000;
}
