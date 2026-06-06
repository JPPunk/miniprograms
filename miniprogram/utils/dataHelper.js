/**
 * 数据助手兼容层
 * 已按职责拆分到 services/ 目录，此处保留以保持页面引用兼容
 * 新代码建议直接引用 services/ 下对应模块
 */

const { storage, recipe, ranking, notification, history, user } = require('../services');

const STORAGE_KEY = storage.STORAGE_KEY;

module.exports = {
  STORAGE_KEY,
  getRecipes: recipe.getAll,
  saveRecipe: recipe.save,
  getRecipeById: recipe.getById,
  likeRecipe: (id, openid) => {
    const result = recipe.toggleLike(id, openid);
    return result ? result.recipe : null;
  },
  isRecipeLiked: recipe.isLiked,
  getMyRecipes: recipe.getMyRecipes,
  getFavorites: recipe.getFavorites,
  addToHistory: history.add,
  getHistory: history.getAll,
  getNotifications: notification.getAll,
  markNotificationRead: notification.markRead,
  getUnreadCount: notification.getUnreadCount,
  getRankingByLikes: ranking.byLikes,
  getRankingByPrice: ranking.byPrice,
  getRankingByValue: ranking.byValue,
  getRankingByTime: ranking.byTime,
  initMockData: recipe.initMockData
};
