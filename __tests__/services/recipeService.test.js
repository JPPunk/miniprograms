const recipeService = require('../../miniprogram/services/recipeService');

describe('recipeService', () => {
  beforeEach(() => {
    // Mock local storage
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'local_db_recipes') return [];
      if (key === 'local_db_users') return [];
      return null;
    });
    wx.setStorageSync.mockClear();
  });

  afterEach(() => {
    wx.getStorageSync.mockClear();
  });

  test('getAll returns empty array by default', async () => {
    const result = await recipeService.getAll();
    expect(result).toEqual([]);
  });

  test('save creates a recipe with required fields', async () => {
    const input = {
      name: '测试菜',
      emoji: '🥗',
      totalPrice: '25.50',
      dishImages: [],
      ingredientItems: [{ name: '测试食材', qty: '1', unit: '份', price: '25.50', image: '' }],
      steps: [{ content: '测试步骤', image: '' }]
    };

    const recipe = await recipeService.save(input);

    expect(recipe.name).toBe('测试菜');
    expect(recipe.emoji).toBe('🥗');
    expect(recipe.totalPrice).toBe('25.50');
    expect(recipe.authorName).toBe('我');
    expect(recipe.likes).toBe(0);
    expect(recipe._id).toBeDefined();
    expect(recipe.uploadTime).toBeDefined();
  });

  test('save filters empty ingredients and steps', async () => {
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

    const recipe = await recipeService.save(input);
    expect(recipe.ingredientItems.length).toBe(1);
    expect(recipe.steps.length).toBe(1);
  });

  test('toggleLike adds like and returns isLiked true', async () => {
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'local_db_recipes') {
        return [{ _id: 'r1', name: '菜', likes: 0, likedUsers: [] }];
      }
      if (key === 'local_db_users') return [];
      return null;
    });

    const result = await recipeService.toggleLike('r1', 'user1');
    expect(result.isLiked).toBe(true);
    expect(result.recipe.likes).toBe(1);
  });

  test('toggleLike removes like when already liked', async () => {
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'local_db_recipes') {
        return [{ _id: 'r1', name: '菜', likes: 1, likedUsers: ['user1'] }];
      }
      if (key === 'local_db_users') return [];
      return null;
    });

    const result = await recipeService.toggleLike('r1', 'user1');
    expect(result.isLiked).toBe(false);
    expect(result.recipe.likes).toBe(0);
  });

  test('isLiked returns correct state', async () => {
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'local_db_recipes') {
        return [{ _id: 'r1', name: '菜', likes: 1, likedUsers: ['user1'] }];
      }
      return null;
    });

    expect(await recipeService.isLiked('r1', 'user1')).toBe(true);
    expect(await recipeService.isLiked('r1', 'user2')).toBe(false);
  });

  test('initMockData initializes only when empty', async () => {
    let callCount = 0;
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'local_db_recipes') {
        callCount++;
        if (callCount === 1) return [];
        return [{ _id: '1', name: '已有' }];
      }
      return [];
    });

    expect(await recipeService.initMockData()).toBe(true);
    expect(await recipeService.initMockData()).toBe(false);
  });

  test('delete removes recipe from storage', async () => {
    const recipes = [
      { _id: 'r1', name: '菜1', authorId: 'test_user' },
      { _id: 'r2', name: '菜2', authorId: 'other' }
    ];
    wx.getStorageSync.mockImplementation((key) => {
      if (key === 'local_db_recipes') return [...recipes];
      if (key === 'local_db_users') return [];
      return null;
    });

    const result = await recipeService.delete('r1');
    expect(result).toBe(true);

    // 验证 setStorageSync 被调用，且数据中不再包含 r1
    const lastCall = wx.setStorageSync.mock.calls.find(c => c[0] === 'local_db_recipes');
    expect(lastCall).toBeDefined();
    expect(lastCall[1].find(r => r._id === 'r1')).toBeUndefined();
    expect(lastCall[1].find(r => r._id === 'r2')).toBeDefined();
  });
});
