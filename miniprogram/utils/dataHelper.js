const STORAGE_KEY = {
  RECIPES: 'recipes',
  MY_RECIPES: 'myRecipes',
  FAVORITES: 'favorites',
  HISTORY: 'history',
  NOTIFICATIONS: 'notifications'
};

function getRecipes() {
  return wx.getStorageSync(STORAGE_KEY.RECIPES) || [];
}

function saveRecipe(recipe) {
  const recipes = getRecipes();
  recipe._id = Date.now().toString();
  recipe.createTime = new Date().toLocaleDateString('zh-CN');
  recipe.likes = 0;
  recipe.likedUsers = [];
  recipe.authorName = '我';
  recipe.uploadTime = Date.now();
  recipes.unshift(recipe);
  wx.setStorageSync(STORAGE_KEY.RECIPES, recipes);

  const myRecipes = wx.getStorageSync(STORAGE_KEY.MY_RECIPES) || [];
  myRecipes.unshift(recipe._id);
  wx.setStorageSync(STORAGE_KEY.MY_RECIPES, myRecipes);

  return recipe;
}

function getRecipeById(id) {
  const recipes = getRecipes();
  return recipes.find(r => r._id === id);
}

function likeRecipe(id, openid) {
  const recipes = getRecipes();
  const recipe = recipes.find(r => r._id === id);
  if (!recipe) return null;

  if (!recipe.likedUsers) recipe.likedUsers = [];

  const userIndex = recipe.likedUsers.indexOf(openid);
  if (userIndex > -1) {
    recipe.likedUsers.splice(userIndex, 1);
    recipe.likes--;
  } else {
    recipe.likedUsers.push(openid);
    recipe.likes++;

    const notifications = wx.getStorageSync(STORAGE_KEY.NOTIFICATIONS) || [];
    notifications.unshift({
      id: Date.now().toString(),
      type: 'like',
      recipeId: id,
      recipeName: recipe.name,
      message: '有人点赞了你的菜谱',
      time: new Date().toLocaleString('zh-CN'),
      read: false
    });
    wx.setStorageSync(STORAGE_KEY.NOTIFICATIONS, notifications);
  }

  wx.setStorageSync(STORAGE_KEY.RECIPES, recipes);
  return recipe;
}

function isRecipeLiked(id, openid) {
  const recipes = getRecipes();
  const recipe = recipes.find(r => r._id === id);
  if (!recipe || !recipe.likedUsers) return false;
  return recipe.likedUsers.indexOf(openid) > -1;
}

function getMyRecipes() {
  const myRecipeIds = wx.getStorageSync(STORAGE_KEY.MY_RECIPES) || [];
  const recipes = getRecipes();
  return myRecipeIds.map(id => recipes.find(r => r._id === id)).filter(Boolean);
}

function getFavorites(openid) {
  const recipes = getRecipes();
  return recipes.filter(r => r.likedUsers && r.likedUsers.indexOf(openid) > -1);
}

function addToHistory(recipeId) {
  let history = wx.getStorageSync(STORAGE_KEY.HISTORY) || [];
  history = history.filter(id => id !== recipeId);
  history.unshift(recipeId);
  if (history.length > 50) history = history.slice(0, 50);
  wx.setStorageSync(STORAGE_KEY.HISTORY, history);
}

function getHistory() {
  const historyIds = wx.getStorageSync(STORAGE_KEY.HISTORY) || [];
  const recipes = getRecipes();
  return historyIds.map(id => recipes.find(r => r._id === id)).filter(Boolean);
}

function getNotifications() {
  return wx.getStorageSync(STORAGE_KEY.NOTIFICATIONS) || [];
}

function markNotificationRead(id) {
  const notifications = getNotifications();
  const notification = notifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
    wx.setStorageSync(STORAGE_KEY.NOTIFICATIONS, notifications);
  }
}

function getUnreadCount() {
  const notifications = getNotifications();
  return notifications.filter(n => !n.read).length;
}

function getRankingByLikes(limit = 100) {
  const recipes = getRecipes();
  return recipes.sort((a, b) => b.likes - a.likes).slice(0, limit);
}

function getRankingByPrice(limit = 100) {
  const recipes = getRecipes();
  return recipes.sort((a, b) => parseFloat(a.totalPrice) - parseFloat(b.totalPrice)).slice(0, limit);
}

function getRankingByValue(limit = 100) {
  const recipes = getRecipes();
  const now = Date.now();
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  return recipes
    .filter(r => {
      const uploadTime = r.uploadTime || (now - Math.random() * 60 * 24 * 60 * 60 * 1000);
      return uploadTime >= oneMonthAgo;
    })
    .map(r => {
      const price = parseFloat(r.totalPrice) || 1;
      r.valueScore = r.likes / price;
      return r;
    })
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, limit);
}

function getRankingByTime(limit = 100) {
  const recipes = getRecipes();
  return recipes.sort((a, b) => {
    const timeA = a.uploadTime || 0;
    const timeB = b.uploadTime || 0;
    return timeB - timeA;
  }).slice(0, limit);
}

function initMockData() {
  if (getRecipes().length === 0) {
    const now = Date.now();
    const mockRecipes = [
      {
        _id: '1',
        name: '红烧肉',
        emoji: '🥩',
        authorName: '张三',
        createTime: '2026-05-01',
        uploadTime: now - 25 * 24 * 60 * 60 * 1000,
        totalPrice: '45.50',
        dishImages: [],
        ingredientItems: [
          { name: '五花肉', qty: '500', unit: '克(g)', price: '25.00', image: '' },
          { name: '生抽', qty: '2', unit: '勺', price: '3.00', image: '' },
          { name: '老抽', qty: '1', unit: '勺', price: '2.50', image: '' },
          { name: '冰糖', qty: '30', unit: '克(g)', price: '5.00', image: '' },
          { name: '料酒', qty: '适量', unit: '按需', price: '2.00', image: '' },
          { name: '姜片', qty: '5', unit: '片', price: '1.00', image: '' },
          { name: '八角', qty: '2', unit: '个', price: '1.00', image: '' }
        ],
        steps: [
          { content: '五花肉切块，冷水下锅焯水去血沫', image: '' },
          { content: '热锅下油，放入冰糖小火炒糖色至焦糖色', image: '' },
          { content: '放入五花肉翻炒上色，让每块肉都裹上糖色', image: '' },
          { content: '加入生抽、老抽、料酒翻炒均匀', image: '' },
          { content: '加开水没过肉，放姜片八角，大火烧开转小火炖1小时', image: '' },
          { content: '大火收汁即可出锅', image: '' }
        ],
        likes: 128,
        likedUsers: []
      },
      {
        _id: '2',
        name: '番茄炒蛋',
        emoji: '🍳',
        authorName: '李四',
        createTime: '2026-05-02',
        uploadTime: now - 20 * 24 * 60 * 60 * 1000,
        totalPrice: '12.00',
        dishImages: [],
        ingredientItems: [
          { name: '番茄', qty: '2', unit: '个', price: '4.00', image: '' },
          { name: '鸡蛋', qty: '3', unit: '个', price: '5.00', image: '' },
          { name: '食用油', qty: '适量', unit: '按需', price: '1.00', image: '' },
          { name: '盐', qty: '少许', unit: '少许', price: '0.50', image: '' },
          { name: '葱花', qty: '适量', unit: '按需', price: '1.50', image: '' }
        ],
        steps: [
          { content: '番茄洗净切块，鸡蛋打散加少许盐搅匀', image: '' },
          { content: '热锅凉油，倒入蛋液炒至凝固盛出', image: '' },
          { content: '锅中再加少许油，放入番茄块翻炒出汁', image: '' },
          { content: '加入炒好的鸡蛋，加盐调味翻炒均匀', image: '' },
          { content: '撒上葱花即可出锅', image: '' }
        ],
        likes: 95,
        likedUsers: []
      },
      {
        _id: '3',
        name: '宫保鸡丁',
        emoji: '🍗',
        authorName: '王五',
        createTime: '2026-05-03',
        uploadTime: now - 15 * 24 * 60 * 60 * 1000,
        totalPrice: '35.80',
        dishImages: [],
        ingredientItems: [
          { name: '鸡胸肉', qty: '300', unit: '克(g)', price: '15.00', image: '' },
          { name: '花生米', qty: '50', unit: '克(g)', price: '5.00', image: '' },
          { name: '干辣椒', qty: '10', unit: '克(g)', price: '2.00', image: '' },
          { name: '花椒', qty: '5', unit: '克(g)', price: '1.50', image: '' },
          { name: '葱段', qty: '适量', unit: '按需', price: '1.00', image: '' },
          { name: '生抽', qty: '2', unit: '勺', price: '3.00', image: '' },
          { name: '醋', qty: '1', unit: '勺', price: '1.00', image: '' },
          { name: '糖', qty: '1', unit: '勺', price: '0.80', image: '' },
          { name: '料酒', qty: '1', unit: '勺', price: '1.50', image: '' }
        ],
        steps: [
          { content: '鸡胸肉切丁，用料酒、生抽、淀粉腌制15分钟', image: '' },
          { content: '调酱汁：生抽、醋、糖、淀粉、水拌匀', image: '' },
          { content: '花生米炸至金黄酥脆备用，干辣椒切段', image: '' },
          { content: '热锅下油，小火煸香花椒和干辣椒', image: '' },
          { content: '放入鸡丁大火翻炒至变色', image: '' },
          { content: '倒入酱汁翻炒均匀，出锅前加入花生米和葱段', image: '' }
        ],
        likes: 86,
        likedUsers: []
      },
      {
        _id: '4',
        name: '糖醋排骨',
        emoji: '🍖',
        authorName: '赵六',
        createTime: '2026-05-04',
        uploadTime: now - 10 * 24 * 60 * 60 * 1000,
        totalPrice: '58.00',
        dishImages: [],
        ingredientItems: [
          { name: '排骨', qty: '500', unit: '克(g)', price: '35.00', image: '' },
          { name: '醋', qty: '3', unit: '勺', price: '3.00', image: '' },
          { name: '糖', qty: '4', unit: '勺', price: '4.00', image: '' },
          { name: '生抽', qty: '2', unit: '勺', price: '3.00', image: '' },
          { name: '老抽', qty: '1', unit: '勺', price: '2.00', image: '' },
          { name: '料酒', qty: '1', unit: '勺', price: '1.50', image: '' },
          { name: '姜片', qty: '5', unit: '片', price: '1.00', image: '' },
          { name: '白芝麻', qty: '适量', unit: '按需', price: '1.50', image: '' }
        ],
        steps: [
          { content: '排骨切段，冷水下锅焯水去血沫，捞出沥干', image: '' },
          { content: '调糖醋汁：醋、糖、生抽、老抽、料酒混合', image: '' },
          { content: '热锅下油，放入姜片爆香', image: '' },
          { content: '放入排骨翻炒至表面微黄', image: '' },
          { content: '倒入糖醋汁，加水没过排骨，大火烧开转小火炖40分钟', image: '' },
          { content: '大火收汁至浓稠，撒上白芝麻即可', image: '' }
        ],
        likes: 72,
        likedUsers: []
      },
      {
        _id: '5',
        name: '麻婆豆腐',
        emoji: '🧈',
        authorName: '钱七',
        createTime: '2026-05-05',
        uploadTime: now - 5 * 24 * 60 * 60 * 1000,
        totalPrice: '15.50',
        dishImages: [],
        ingredientItems: [
          { name: '嫩豆腐', qty: '1', unit: '块', price: '3.00', image: '' },
          { name: '肉末', qty: '100', unit: '克(g)', price: '5.00', image: '' },
          { name: '豆瓣酱', qty: '2', unit: '勺', price: '2.00', image: '' },
          { name: '花椒粉', qty: '适量', unit: '按需', price: '1.00', image: '' },
          { name: '辣椒粉', qty: '适量', unit: '按需', price: '0.50', image: '' },
          { name: '蒜末', qty: '适量', unit: '按需', price: '1.00', image: '' },
          { name: '葱花', qty: '适量', unit: '按需', price: '1.00', image: '' },
          { name: '生抽', qty: '1', unit: '勺', price: '1.00', image: '' },
          { name: '淀粉', qty: '适量', unit: '按需', price: '1.00', image: '' }
        ],
        steps: [
          { content: '豆腐切小块，用淡盐水焯烫2分钟捞出沥干', image: '' },
          { content: '热锅下油，放入肉末翻炒至变色', image: '' },
          { content: '加入豆瓣酱、辣椒粉、蒜末炒出红油', image: '' },
          { content: '加入适量清水或高汤，放入豆腐块', image: '' },
          { content: '加生抽调味，小火煮5分钟让豆腐入味', image: '' },
          { content: '淀粉加水勾芡，出锅前撒花椒粉和葱花', image: '' }
        ],
        likes: 65,
        likedUsers: []
      }
    ];
    wx.setStorageSync(STORAGE_KEY.RECIPES, mockRecipes);
  }
}

module.exports = {
  STORAGE_KEY,
  getRecipes,
  saveRecipe,
  getRecipeById,
  likeRecipe,
  isRecipeLiked,
  getMyRecipes,
  getFavorites,
  addToHistory,
  getHistory,
  getNotifications,
  markNotificationRead,
  getUnreadCount,
  getRankingByLikes,
  getRankingByPrice,
  getRankingByValue,
  getRankingByTime,
  initMockData
};