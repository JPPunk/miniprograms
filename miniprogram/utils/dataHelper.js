/**
 * 数据助手兼容层 - 云开发适配版
 * 优先使用云函数，降级到本地服务
 * 微信运行时兼容：全部用 var，module.exports 整体赋值，懒加载各服务
 */

var _recipeService = null;
var _historyService = null;
var _notificationService = null;
var _rankingService = null;
var _userService = null;
var _storage = null;

// 检查是否使用云开发
function useCloud() {
  if (!_storage) _storage = require('../services/storage');
  return _storage.isCloudAvailable();
}

// 获取 openid
function getOpenid() {
  var app = getApp();
  return app && app.globalData ? app.globalData.openid : null;
}

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

// ========== 菜谱相关 ==========
function _getRecipes() {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'rankings',
      data: { action: 'byTime', data: { limit: 100 } }
    }).then(function (res) {
      return res.result && res.result.data ? res.result.data : [];
    });
  }
  return getRecipe().getAll();
}

function _saveRecipe(data) {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'recipeManage',
      data: { action: 'create', data: data }
    }).then(function (res) {
      return res.result;
    });
  }
  return getRecipe().save(data);
}

function _getRecipeById(id) {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'recipeManage',
      data: { action: 'getById', data: { recipeId: id } }
    }).then(function (res) {
      return res.result && res.result.data ? res.result.data : null;
    });
  }
  return getRecipe().getById(id);
}

function _updateRecipe(recipe) {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'recipeManage',
      data: { action: 'update', data: recipe }
    }).then(function (res) {
      return res.result;
    });
  }
  return getRecipe().update(recipe);
}

function _deleteRecipe(id) {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'recipeManage',
      data: { action: 'delete', data: { recipeId: id } }
    }).then(function (res) {
      return res.result;
    });
  }
  return getRecipe().delete(id);
}

function _likeRecipe(id, openid) {
  var uid = openid || getOpenid();
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'likes',
      data: { action: 'toggleLike', data: { recipeId: id } }
    }).then(function (res) {
      return res.result;
    });
  }
  return getRecipe().toggleLike(id, uid).then(function (result) {
    return result ? result.recipe : null;
  });
}

function _isRecipeLiked(id, uid) {
  var userId = uid || getOpenid();
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'likes',
      data: { action: 'isLiked', data: { recipeId: id } }
    }).then(function (res) {
      return res.result && res.result.isLiked ? res.result.isLiked : false;
    });
  }
  return getRecipe().isLiked(id, userId);
}

function _getMyRecipes() {
  var openid = getOpenid();
  if (useCloud() && openid) {
    return wx.cloud.callFunction({
      name: 'rankings',
      data: { action: 'getMyRecipes', data: { openid: openid } }
    }).then(function (res) {
      return res.result && res.result.data ? res.result.data : [];
    });
  }
  return getRecipe().getMyRecipes();
}

function _getFavorites(uid) {
  var userId = uid || getOpenid();
  if (useCloud() && userId) {
    return wx.cloud.callFunction({
      name: 'rankings',
      data: { action: 'getFavorites', data: { openid: userId } }
    }).then(function (res) {
      return res.result && res.result.data ? res.result.data : [];
    });
  }
  return getRecipe().getFavorites(userId);
}

// ========== 历史记录 ==========
function _addToHistory(id) {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'users',
      data: { action: 'addHistory', data: { recipeId: id } }
    });
  }
  return getHistory().add(id);
}

function _getHistory() {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'users',
      data: { action: 'getHistory' }
    }).then(function (res) {
      return res.result && res.result.data ? res.result.data : [];
    });
  }
  return getHistory().getAll();
}

// ========== 通知 ==========
function _getNotifications() {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'users',
      data: { action: 'getUserInfo' }
    }).then(function (res) {
      if (res.result && res.result.data && res.result.data.notifications) {
        return res.result.data.notifications;
      }
      return [];
    });
  }
  return getNotification().getAll();
}

function _markNotificationRead(id) {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'users',
      data: { action: 'markNotificationRead', data: { notificationId: id } }
    });
  }
  return getNotification().markRead(id);
}

function _getUnreadCount() {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'users',
      data: { action: 'getUnreadCount' }
    }).then(function (res) {
      return res.result && res.result.count ? res.result.count : 0;
    });
  }
  return getNotification().getUnreadCount();
}

// ========== 排行榜 ==========
function _getRankingByLikes() {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'rankings',
      data: { action: 'byLikes', data: { limit: 100 } }
    }).then(function (res) {
      return res.result && res.result.data ? res.result.data : [];
    });
  }
  return getRanking().byLikes();
}

function _getRankingByPrice() {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'rankings',
      data: { action: 'byPrice', data: { limit: 100 } }
    }).then(function (res) {
      return res.result && res.result.data ? res.result.data : [];
    });
  }
  return getRanking().byPrice();
}

function _getRankingByValue() {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'rankings',
      data: { action: 'byValue', data: { limit: 100 } }
    }).then(function (res) {
      return res.result && res.result.data ? res.result.data : [];
    });
  }
  return getRanking().byValue();
}

function _getRankingByTime() {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'rankings',
      data: { action: 'byTime', data: { limit: 100 } }
    }).then(function (res) {
      return res.result && res.result.data ? res.result.data : [];
    });
  }
  return getRanking().byTime();
}

// ========== 用户 ==========
function _getUserInfo() {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'users',
      data: { action: 'getUserInfo' }
    }).then(function (res) {
      return res.result && res.result.data ? res.result.data : null;
    });
  }
  return getUser().getInfo();
}

function _setUserInfo(info) {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'users',
      data: { action: 'updateUserInfo', data: info }
    });
  }
  return getUser().setInfo(info);
}

function _getUserId() {
  var app = getApp();
  if (app && app.globalData && app.globalData.openid) {
    return Promise.resolve(app.globalData.openid);
  }
  return getUser().getUserId();
}

function _getRole() {
  if (useCloud()) {
    return wx.cloud.callFunction({
      name: 'users',
      data: { action: 'getUserInfo' }
    }).then(function (res) {
      return res.result && res.result.data && res.result.data.role ? res.result.data.role : 'user';
    });
  }
  return getUser().getRole();
}

function _isAdmin() {
  if (useCloud()) {
    return _getRole().then(function (role) {
      return role === 'admin';
    });
  }
  return getUser().isAdmin();
}

// ========== 初始化 ==========
function _initMockData() {
  // 云环境下不需要初始化 Mock 数据
  if (useCloud()) {
    return Promise.resolve(false);
  }
  return getRecipe().initMockData();
}

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
  isAdmin: _isAdmin,
  useCloud: useCloud
};
