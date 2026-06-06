const recipeService = require('../../miniprogram/services/recipeService');

describe('recipeService', () => {
  beforeEach(() => {
    wx.getStorageSync.mockReturnValue(null);
    wx.setStorageSync.mockClear();
  });

  test('getAll returns empty array by default', () => {
    wx.getStorageSync.mockReturnValue(null);
    expect(recipeService.getAll()).toEqual([]);
  });

  test('save creates a recipe with required fields', () => {
    const input = {
      name: '测试菜',
      emoji: '🥗',
      totalPrice: '25.50',
      dishImages: [],
      ingredientItems: [{ name: '测试食材', qty: '1', unit: '份', price: '25.50', image: '' }],
      steps: [{ content: '测试步骤', image: '' }]
    };

    const recipe = recipeService.save(input);

    expect(recipe.name).toBe('测试菜');
    expect(recipe.emoji).toBe('🥗');
    expect(recipe.totalPrice).toBe('25.50');
    expect(recipe.authorName).toBe('我');
    expect(recipe.likes).toBe(0);
    expect(recipe._id).toBeDefined();
    expect(recipe.uploadTime).toBeDefined();
  });

  test('save filters empty ingredients and steps', () => {
    const input = {
      name: '测试菜',
      totalPrice: '10.00',
      ingredientItems: [
        { name: '有效食材', qty: '1', unit: '份', price: '10.00', image: '' },
        { name: '', qty: '', unit: '', price: '', image: '' }
      ],
      steps: [
        { content: '有效步骤', image: '' },
        { content: '', image: '' }
      ]
    };

    const recipe = recipeService.save(input);
    expect(recipe.ingredientItems.length).toBe(1);
    expect(recipe.steps.length).toBe(1);
  });

  test('toggleLike adds like and returns isLiked true', () => {
    wx.getStorageSync.mockReturnValue([
      { _id: 'r1', name: '菜', likes: 0, likedUsers: [] }
    ]);

    const result = recipeService.toggleLike('r1', 'user1');
    expect(result.isLiked).toBe(true);
    expect(result.recipe.likes).toBe(1);
  });

  test('toggleLike removes like when already liked', () => {
    wx.getStorageSync.mockReturnValue([
      { _id: 'r1', name: '菜', likes: 1, likedUsers: ['user1'] }
    ]);

    const result = recipeService.toggleLike('r1', 'user1');
    expect(result.isLiked).toBe(false);
    expect(result.recipe.likes).toBe(0);
  });

  test('isLiked returns correct state', () => {
    wx.getStorageSync.mockReturnValue([
      { _id: 'r1', name: '菜', likes: 1, likedUsers: ['user1'] }
    ]);

    expect(recipeService.isLiked('r1', 'user1')).toBe(true);
    expect(recipeService.isLiked('r1', 'user2')).toBe(false);
  });

  test('initMockData initializes only when empty', () => {
    wx.getStorageSync.mockReturnValueOnce([]).mockReturnValueOnce([
      { _id: '1', name: '已有' }
    ]);

    expect(recipeService.initMockData()).toBe(true);
    expect(recipeService.initMockData()).toBe(false);
  });
});
