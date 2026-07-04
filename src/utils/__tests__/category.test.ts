import { describe, it, expect } from 'vitest';
import { isSleepItemByName } from '../../protocolDomain/category';

describe('isSleepItemByName', () => {
  it('matches timed wake variants (they must bucket as sleep cards)', () => {
    expect(isSleepItemByName('Wake 5')).toBe(true);
    expect(isSleepItemByName('Wake at 4am')).toBe(true);
    expect(isSleepItemByName('Wake up')).toBe(true);
    expect(isSleepItemByName('Wake')).toBe(true);
  });
  it('matches the anchor + wind-down names', () => {
    expect(isSleepItemByName('End Sleep')).toBe(true);
    expect(isSleepItemByName('Start Sleep')).toBe(true);
    expect(isSleepItemByName('Sleep')).toBe(true);
    expect(isSleepItemByName('Lights Out')).toBe(true);
  });
  it('does not match non-sleep names', () => {
    expect(isSleepItemByName('Wakeboarding')).toBe(false);
    expect(isSleepItemByName('Water Cleanse')).toBe(false);
    expect(isSleepItemByName('Red Light Therapy')).toBe(false);
  });
});
