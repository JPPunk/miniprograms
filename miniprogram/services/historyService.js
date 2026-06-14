/**
 * 历史记录服务
 * 微信运行时兼容：全部用 var，module.exports 整体赋值，不使用 async/await
 */

var _storage = null;
function _getStorage() {
  if (!_storage) _storage = require('./storage');
  return _storage;
}
var _recipeService = null;
function _getRecipeService() {
  if (!_recipeService) _recipeService = require('./recipeService');
  return _recipeService;
}

var MAX_HISTORY = 50;

function getCurrentUserId() {
  var app = getApp();
  if (app && app.globalData && app.globalData.userInfo) {
    return app.globalData.userInfo.id;
  }
  return 'test_user';
}

function addHistory(recipeId) {
  var s = _getStorage();
  var userId = getCurrentUserId();
  return s.getById(s.COLLECTIONS.USERS, userId).then(function (userDoc) {
    var history = userDoc && userDoc.history ? userDoc.history : [];
    history = history.filter(function (id) { return id !== recipeId; });
    history.unshift(recipeId);
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    if (userDoc) {
      return s.update(s.COLLECTIONS.USERS, userId, { history: history });
    } else {
      return s.add(s.COLLECTIONS.USERS, { _id: userId, history: history, favorites: [], notifications: [] });
    }
  }).then(function () {
    return [];
  });
}

function getAllHistory() {
  var s = _getStorage();
  var userId = getCurrentUserId();
  return s.getById(s.COLLECTIONS.USERS, userId).then(function (userDoc) {
    if (!userDoc || !userDoc.history || userDoc.history.length === 0) return [];
    var rs = _getRecipeService();
    return Promise.all(
      userDoc.history.map(function (id) { return rs.getById(id); })
    ).then(function (recipes) {
      return recipes.filter(Boolean);
    });
  });
}

function clearHistory() {
  var s = _getStorage();
  var userId = getCurrentUserId();
  return s.update(s.COLLECTIONS.USERS, userId, { history: [] });
}

module.exports = {
  add: addHistory,
  getAll: getAllHistory,
  clear: clearHistory
};
