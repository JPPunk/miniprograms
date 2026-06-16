/**
 * 通知服务
 * 微信运行时兼容：全部用 var，module.exports 整体赋值，不使用 async/await
 */

var _storage = null;
function _getStorage() {
  if (!_storage) _storage = require('./storage');
  return _storage;
}
var _common = null;
function _getCommon() {
  if (!_common) _common = require('../utils/common');
  return _common;
}

function getCurrentUserId() {
  var app = getApp();
  if (app && app.globalData && app.globalData.userInfo) {
    return app.globalData.userInfo.id;
  }
  return 'test_user';
}

function getAllNotifications() {
  var s = _getStorage();
  var userId = getCurrentUserId();
  return s.getById(s.COLLECTIONS.USERS, userId).then(function (userDoc) {
    if (!userDoc || !userDoc.notifications) return [];
    return userDoc.notifications;
  });
}

function addNotification(info) {
  var s = _getStorage();
  var c = _getCommon();
  var targetUserId = info.userId || getCurrentUserId();
  var notification = {
    id: c.generateId(),
    type: info.type || 'system',
    recipeId: info.recipeId,
    recipeName: info.recipeName,
    message: info.message,
    time: new Date().toLocaleString('zh-CN'),
    read: false
  };
  return s.getById(s.COLLECTIONS.USERS, targetUserId).then(function (userDoc) {
    var notifications = userDoc && userDoc.notifications ? userDoc.notifications : [];
    notifications.unshift(notification);
    if (userDoc) {
      return s.update(s.COLLECTIONS.USERS, targetUserId, { notifications: notifications });
    } else {
      return s.add(s.COLLECTIONS.USERS, { _id: targetUserId, notifications: notifications, history: [], favorites: [] });
    }
  }).then(function () {
    return notification;
  });
}

function markRead(notificationId) {
  var s = _getStorage();
  var userId = getCurrentUserId();
  return s.getById(s.COLLECTIONS.USERS, userId).then(function (userDoc) {
    if (!userDoc || !userDoc.notifications) return null;
    var item = null;
    for (var i = 0; i < userDoc.notifications.length; i++) {
      if (userDoc.notifications[i].id === notificationId) {
        userDoc.notifications[i].read = true;
        item = userDoc.notifications[i];
        break;
      }
    }
    if (item) {
      return s.update(s.COLLECTIONS.USERS, userId, { notifications: userDoc.notifications }).then(function () {
        return item;
      });
    }
    return null;
  });
}

function getUnreadCount() {
  return getAllNotifications().then(function (notifications) {
    var count = 0;
    for (var i = 0; i < notifications.length; i++) {
      if (!notifications[i].read) count++;
    }
    return count;
  });
}

module.exports = {
  getAll: getAllNotifications,
  addNotification: addNotification,
  markRead: markRead,
  getUnreadCount: getUnreadCount
};
