const { STORAGE_KEY, get, set } = require('./storage');
const { generateId, now, formatPrice } = require('../utils/common');

const MOCK_USER_ID = 'test_user';
const MOCK_AUTHOR = '我';

function getAll() {
  return get(STORAGE_KEY.RECIPES, []);
}

function getById(id) {
  const recipes = getAll();
  return recipes.find(r => r._id === id) || null;
}

function save(recipeInput) {
  const recipes = getAll();
  const recipe = {
    _id: generateId(),
    name: recipeInput.name.trim(),
    emoji: recipeInput.emoji || '🍽️',
    authorName: MOCK_AUTHOR,
    createTime: new Date().toLocaleDateString('zh-CN'),
    uploadTime: now(),
    totalPrice: formatPrice(recipeInput.totalPrice),
    dishImages: recipeInput.dishImages || [],
    ingredientItems: (recipeInput.ingredientItems || []).filter(i => i.name.trim()),
    steps: (recipeInput.steps || []).filter(s => s.content.trim()),
    likes: 0,
    likedUsers: []
  };

  recipes.unshift(recipe);
  set(STORAGE_KEY.RECIPES, recipes);

  const myRecipeIds = get(STORAGE_KEY.MY_RECIPES, []);
  myRecipeIds.unshift(recipe._id);
  set(STORAGE_KEY.MY_RECIPES, myRecipeIds);

  return recipe;
}

function update(recipe) {
  const recipes = getAll();
  const index = recipes.findIndex(r => r._id === recipe._id);
  if (index === -1) return null;
  recipes[index] = recipe;
  set(STORAGE_KEY.RECIPES, recipes);
  return recipe;
}

function toggleLike(id, userId = MOCK_USER_ID) {
  const recipe = getById(id);
  if (!recipe) return null;

  if (!recipe.likedUsers) recipe.likedUsers = [];

  const userIndex = recipe.likedUsers.indexOf(userId);
  const isLiked = userIndex > -1;

  if (isLiked) {
    recipe.likedUsers.splice(userIndex, 1);
    recipe.likes = Math.max(0, (recipe.likes || 0) - 1);
  } else {
    recipe.likedUsers.push(userId);
    recipe.likes = (recipe.likes || 0) + 1;
  }

  update(recipe);

  if (!isLiked) {
    const { addNotification } = require('./notificationService');
    addNotification({
      type: 'like',
      recipeId: id,
      recipeName: recipe.name,
      message: '有人点赞了你的菜谱'
    });
  }

  return { recipe, isLiked: !isLiked };
}

function isLiked(id, userId = MOCK_USER_ID) {
  const recipe = getById(id);
  if (!recipe || !recipe.likedUsers) return false;
  return recipe.likedUsers.indexOf(userId) > -1;
}

function getMyRecipes() {
  const myRecipeIds = get(STORAGE_KEY.MY_RECIPES, []);
  const recipes = getAll();
  return myRecipeIds
    .map(id => recipes.find(r => r._id === id))
    .filter(Boolean);
}

function getFavorites(userId = MOCK_USER_ID) {
  const recipes = getAll();
  return recipes.filter(r => r.likedUsers && r.likedUsers.indexOf(userId) > -1);
}

function initMockData() {
  if (getAll().length > 0) return false;

  const current = now();
  const day = 24 * 60 * 60 * 1000;
  const mockRecipes = [
    createMockRecipe('1', '红烧肉', '🥩', '张三', '2026-05-01', current - 25 * day, '45.50', 128),
    createMockRecipe('2', '番茄炒蛋', '🍳', '李四', '2026-05-02', current - 20 * day, '12.00', 95),
    createMockRecipe('3', '宫保鸡丁', '🍗', '王五', '2026-05-03', current - 15 * day, '35.80', 86),
    createMockRecipe('4', '糖醋排骨', '🍖', '赵六', '2026-05-04', current - 10 * day, '58.00', 72),
    createMockRecipe('5', '麻婆豆腐', '🧈', '钱七', '2026-05-05', current - 5 * day, '15.50', 65)
  ];

  set(STORAGE_KEY.RECIPES, mockRecipes);
  return true;
}

function createMockRecipe(id, name, emoji, author, createTime, uploadTime, totalPrice, likes) {
  return {
    _id: id,
    name,
    emoji,
    authorName: author,
    createTime,
    uploadTime,
    totalPrice,
    dishImages: [],
    ingredientItems: [{ name: '示例食材', qty: '1', unit: '份', price: totalPrice, image: '' }],
    steps: [{ content: '示例步骤', image: '' }],
    likes,
    likedUsers: []
  };
}

module.exports = {
  getAll,
  getById,
  save,
  update,
  toggleLike,
  isLiked,
  getMyRecipes,
  getFavorites,
  initMockData
};
