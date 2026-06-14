var dataHelper = require('../../utils/dataHelper.js');

Page({
  data: {
    notifications: []
  },

  onLoad: function() {
    this.loadNotifications();
  },

  onShow: function() {
    this.loadNotifications();
  },

  loadNotifications: function() {
    var that = this;
    dataHelper.getNotifications().then(function (notifications) {
      that.setData({ notifications: notifications });
    }).catch(function (err) {
      console.error('加载通知失败:', err);
    });
  },

  onNotificationTap: function(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    dataHelper.markNotificationRead(id).then(function () {
      var notifications = that.data.notifications;
      var notification = null;
      for (var i = 0; i < notifications.length; i++) {
        if (notifications[i].id === id) {
          notification = notifications[i];
          break;
        }
      }
      if (notification && notification.recipeId) {
        wx.navigateTo({
          url: '/pages/detail/detail?id=' + notification.recipeId
        });
      }
    });
  }
});
