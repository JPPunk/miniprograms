/**
 * 数据助手兼容层
 * 微信运行时兼容：全部用 var，module.exports 整体赋值，懒加载各服务
 */

var _recipeService = null;
var _historyService = null;
var _notificationService = null;
var _rankingService = null;
var _userService = null;

function getRecipe() {
  if (!_recipeService) _recipeService = require('../services/recipeService');
  return _recipeService;
}
function getHistory() {
  if (!_historyService) _historyService = require('../services/historyService');
  return _historyService;
}
function getNotification() {
  if (!_notificationService) _notificationService = require('../services/notificationService');
  return _notificationService;
}
function getRanking() {
  if (!_rankingService) _rankingService = require('../services/rankingService');
  return _rankingService;
}
function getUser() {
  if (!_userService) _userService = require('../services/userService');
  return _userService;
}

function _getRecipes() { return getRecipe().getAll(); }
function _saveRecipe(data) { return getRecipe().save(data); }
function _getRecipeById(id) { return getRecipe().getById(id); }
function _updateRecipe(recipe) { return getRecipe().update(recipe); }
function _deleteRecipe(id) { return getRecipe().delete(id); }
function _likeRecipe(id, openid) {
  return getRecipe().toggleLike(id, openid).then(function (result) {
    return result ? result.recipe : null;
  });
}
function _isRecipeLiked(id, uid) { return getRecipe().isLiked(id, uid); }
function _getMyRecipes() { return getRecipe().getMyRecipes(); }
function _getFavorites(uid) { return getRecipe().getFavorites(uid); }
function _addToHistory(id) { return getHistory().add(id); }
function _getHistory() { return getHistory().getAll(); }
function _getNotifications() { return getNotification().getAll(); }
function _markNotificationRead(id) { return getNotification().markRead(id); }
function _getUnreadCount() { return getNotification().getUnreadCount(); }
function _getRankingByLikes() { return getRanking().byLikes(); }
function _getRankingByPrice() { return getRanking().byPrice(); }
function _getRankingByValue() { return getRanking().byValue(); }
function _getRankingByTime() { return getRanking().byTime(); }
function _initMockData() { return getRecipe().initMockData(); }
function _getUserInfo() { return getUser().getInfo(); }
function _setUserInfo(info) { return getUser().setInfo(info); }
function _getUserId() { return getUser().getUserId(); }
function _getRole() { return getUser().getRole(); }
function _isAdmin() { return getUser().isAdmin(); }

module.exports = {
  getRecipes: _getRecipes,
  saveRecipe: _saveRecipe,
  getRecipeById: _getRecipeById,
  updateRecipe: _updateRecipe,
  deleteRecipe: _deleteRecipe,
  likeRecipe: _likeRecipe,
  isRecipeLiked: _isRecipeLiked,
  getMyRecipes: _getMyRecipes,
  getFavorites: _getFavorites,
  addToHistory: _addToHistory,
  getHistory: _getHistory,
  getNotifications: _getNotifications,
  markNotificationRead: _markNotificationRead,
  getUnreadCount: _getUnreadCount,
  getRankingByLikes: _getRankingByLikes,
  getRankingByPrice: _getRankingByPrice,
  getRankingByValue: _getRankingByValue,
  getRankingByTime: _getRankingByTime,
  initMockData: _initMockData,
  getUserInfo: _getUserInfo,
  setUserInfo: _setUserInfo,
  getUserId: _getUserId,
  getRole: _getRole,
  isAdmin: _isAdmin
};
