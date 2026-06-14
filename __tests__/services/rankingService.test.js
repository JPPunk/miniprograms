const rankingService = require('../../miniprogram/services/rankingService');

describe('rankingService', () => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const mockRecipes = [
    { _id: '1', name: 'A', likes: 10, totalPrice: '20.00', uploadTime: now - 5 * day },
    { _id: '2', name: 'B', likes: 5, totalPrice: '10.00', uploadTime: now - 10 * day },
    { _id: '3', name: 'C', likes: 20, totalPrice: '50.00', uploadTime: now - 40 * day }
  ];

  beforeEach(() => {
    // Mock local storage: 返回数据 when called with local_db_recipes key
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'local_db_recipes') return mockRecipes;
      return null;
    });
    wx.setStorageSync.mockClear();
  });

  afterEach(() => {
    wx.getStorageSync.mockClear();
  });

  test('byLikes sorts by likes descending', async () => {
    const result = await rankingService.byLikes();
    expect(result[0].name).toBe('C');
    expect(result[1].name).toBe('A');
    expect(result[2].name).toBe('B');
  });

  test('byPrice sorts by price ascending', async () => {
    const result = await rankingService.byPrice();
    expect(result[0].name).toBe('B');
    expect(result[1].name).toBe('A');
    expect(result[2].name).toBe('C');
  });

  test('byValue filters recipes within 30 days', async () => {
    const result = await rankingService.byValue();
    expect(result.length).toBe(2);
    expect(result.some(r => r.name === 'C')).toBe(false);
  });

  test('byValue calculates valueScore', async () => {
    const result = await rankingService.byValue();
    const itemA = result.find(r => r.name === 'A');
    expect(itemA.valueScore).toBe(10 / 20);
  });

  test('byTime sorts by uploadTime descending', async () => {
    const result = await rankingService.byTime();
    expect(result[0].name).toBe('A');
    expect(result[1].name).toBe('B');
    expect(result[2].name).toBe('C');
  });

  test('getDisplayList returns preview when not expanded', () => {
    const list = [1, 2, 3, 4, 5];
    expect(rankingService.getDisplayList(list, false, 3)).toEqual([1, 2, 3]);
    expect(rankingService.getDisplayList(list, true, 3)).toEqual([1, 2, 3, 4, 5]);
  });
});
