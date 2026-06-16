/**
 * 用户服务
 * 微信运行时兼容：全部用 var，module.exports 整体赋值，不使用 async/await
 */

var _storage = null;
function _getStorage() {
  if (!_storage) _storage = require('./storage');
  return _storage;
}
var _adminConfig = null;
function _getAdminConfig() {
  if (!_adminConfig) _adminConfig = require('../config/admin');
  return _adminConfig;
}

var DEFAULT_USER = {
  nickName: '美食爱好者',
  avatarUrl: ''
};

function getCurrentUserId() {
  var app = getApp();
  if (app && app.globalData && app.globalData.userInfo) {
    return app.globalData.userInfo.id;
  }
  return 'test_user';
}

function isAdmin(userId) {
  var uid = userId || getCurrentUserId();
  var adminIds = _getAdminConfig().adminIds;
  return adminIds.indexOf(uid) > -1;
}

function getRole(userId) {
  var uid = userId || getCurrentUserId();
  if (isAdmin(uid)) return Promise.resolve('admin');
  return Promise.resolve('user');
}

function getUserInfo() {
  var s = _getStorage();
  var userId = getCurrentUserId();
  return s.getById(s.COLLECTIONS.USERS, userId).then(function (userDoc) {
    if (userDoc) {
      return {
        nickName: userDoc.nickName || DEFAULT_USER.nickName,
        avatarUrl: userDoc.avatarUrl || DEFAULT_USER.avatarUrl,
        role: isAdmin(userId) ? 'admin' : (userDoc.role || 'user'),
        id: userId
      };
    }
    return { nickName: DEFAULT_USER.nickName, avatarUrl: DEFAULT_USER.avatarUrl, role: isAdmin(userId) ? 'admin' : 'user', id: userId };
  });
}

function setUserInfo(info) {
  var s = _getStorage();
  var userId = getCurrentUserId();
  return s.getById(s.COLLECTIONS.USERS, userId).then(function (userDoc) {
    var data = {
      nickName: info.nickName || DEFAULT_USER.nickName,
      avatarUrl: info.avatarUrl || DEFAULT_USER.avatarUrl
    };
    if (userDoc) {
      return s.update(s.COLLECTIONS.USERS, userId, data);
    } else {
      return s.add(s.COLLECTIONS.USERS, { _id: userId, nickName: data.nickName, avatarUrl: data.avatarUrl, history: [], favorites: [], notifications: [] });
    }
  }).then(function () {
    return getUserInfo();
  });
}

function getUserId() {
  return Promise.resolve(getCurrentUserId());
}

function updateMyRecipes(recipeId) {
  var s = _getStorage();
  var userId = getCurrentUserId();
  return s.getById(s.COLLECTIONS.USERS, userId).then(function (userDoc) {
    var myRecipes = userDoc && userDoc.myRecipes ? userDoc.myRecipes : [];
    myRecipes = [recipeId].concat(myRecipes.filter(function (id) { return id !== recipeId; }));
    if (userDoc) {
      return s.update(s.COLLECTIONS.USERS, userId, { myRecipes: myRecipes });
    } else {
      return s.add(s.COLLECTIONS.USERS, { _id: userId, myRecipes: myRecipes, history: [], favorites: [], notifications: [] });
    }
  });
}

module.exports = {
  getInfo: getUserInfo,
  setInfo: setUserInfo,
  getUserId: getUserId,
  updateMyRecipes: updateMyRecipes,
  getRole: getRole,
  isAdmin: isAdmin
};
