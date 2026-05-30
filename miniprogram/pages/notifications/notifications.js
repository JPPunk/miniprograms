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
    const notifications = dataHelper.getNotifications();
    this.setData({ notifications: notifications });
  },

  onNotificationTap: function(e) {
    const id = e.currentTarget.dataset.id;
    dataHelper.markNotificationRead(id);
    const notification = this.data.notifications.find(n => n.id === id);
    if (notification && notification.recipeId) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=' + notification.recipeId
      });
    }
  }
});