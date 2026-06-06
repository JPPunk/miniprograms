const { generateId, now, formatPrice, clamp } = require('../../miniprogram/utils/common');

describe('common utils', () => {
  test('generateId returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('generateId returns unique values', () => {
    const ids = new Set(Array.from({ length: 10 }, generateId));
    expect(ids.size).toBe(10);
  });

  test('now returns a timestamp', () => {
    const t = now();
    expect(typeof t).toBe('number');
    expect(t).toBeLessThanOrEqual(Date.now() + 1000);
  });

  test('formatPrice formats correctly', () => {
    expect(formatPrice('12.5')).toBe('12.50');
    expect(formatPrice(12.5)).toBe('12.50');
    expect(formatPrice('abc')).toBe('0.00');
    expect(formatPrice(null)).toBe('0.00');
  });

  test('clamp limits values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
