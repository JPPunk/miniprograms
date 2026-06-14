/**
 * 我的页面
 */

var recipeService = require('../../services/recipeService.js');
var historyService = require('../../services/historyService.js');
var notificationService = require('../../services/notificationService.js');
var badgeService = require('../../services/badgeService.js');

Page({
  data: {
    userInfo: { nickName: '美食爱好者', avatar: '' },
    stats: { recipeCount: 0, favoriteCount: 0, likeCount: 0 },
    currentTab: 'recipes',
    myRecipes: [],
    favorites: [],
    history: [],
    notifications: [],
    unreadCount: 0,
    uploadBadge: null,
    likeBadge: null
  },

  onLoad: function () {
    this.loadData();
  },

  onShow: function () {
    this.loadData();
  },

  loadData: function () {
    var that = this;
    var app = getApp();
    var userInfo = (app && app.globalData && app.globalData.userInfo) || { id: 'test_user' };

    // 每项独立加载，失败返回空数组
    var p1;
    try {
      p1 = recipeService.getMyRecipes().then(function (list) {
        return list || [];
      });
    } catch (e) {
      p1 = Promise.resolve([]);
    }

    var p2;
    try {
      p2 = recipeService.getFavorites().then(function (list) {
        return list || [];
      });
    } catch (e) {
      p2 = Promise.resolve([]);
    }

    var p3;
    try {
      p3 = historyService.getAll().then(function (list) {
        return list || [];
      });
    } catch (e) {
      p3 = Promise.resolve([]);
    }

    var p4;
    try {
      p4 = notificationService.getAll().then(function (list) {
        return list || [];
      });
    } catch (e) {
      p4 = Promise.resolve([]);
    }

    var p5;
    try {
      p5 = badgeService.getUserBadges(userInfo.id).then(function (info) {
        return info || { uploadBadge: null, likeBadge: null };
      });
    } catch (e) {
      p5 = Promise.resolve({ uploadBadge: null, likeBadge: null });
    }

    Promise.all([p1, p2, p3, p4, p5]).then(function (results) {
      var myRecipes = results[0] || [];
      var favorites = results[1] || [];
      var historyList = results[2] || [];
      var notifications = results[3] || [];
      var badgeInfo = results[4] || {};

      var totalLikes = 0;
      for (var i = 0; i < myRecipes.length; i++) {
        totalLikes += myRecipes[i].likes || 0;
      }

      var unreadCount = 0;
      for (var j = 0; j < notifications.length; j++) {
        if (!notifications[j].read) unreadCount++;
      }

      that.setData({
        stats: {
          recipeCount: myRecipes.length,
          favoriteCount: favorites.length,
          likeCount: totalLikes
        },
        myRecipes: myRecipes,
        favorites: favorites,
        history: historyList,
        notifications: notifications,
        unreadCount: unreadCount,
        uploadBadge: badgeInfo.uploadBadge || null,
        likeBadge: badgeInfo.likeBadge || null
      });
    }).catch(function (e) {
      console.error('[我的] 数据加载失败:', e);
    });
  },

  onTabChange: function (e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab });
  },

  onMenuTap: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id === 'about') {
      wx.showModal({
        title: '关于妙算小厨',
        content: '版本：1.0.0\n一个帮你计算菜谱成本的小程序',
        showCancel: false
      });
    }
  },

  onNotificationTap: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    notificationService.markRead(id).then(function () {
      that.loadData();
    });
  },

  onSwitchChange: function (e) {
    var key = e.currentTarget.dataset.key;
    this.setData({ [key]: e.detail.value });
  },

  goToDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  goToNotificationList: function () {
    wx.navigateTo({ url: '/pages/notifications/notifications' });
  },

  onRecipeLongPress: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['编辑', '删除'],
      success: function (res) {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: '/pages/upload/upload?id=' + id });
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: '确认删除',
            content: '删除后无法恢复，确定要删除吗？',
            confirmColor: '#e64340',
            success: function (modalRes) {
              if (modalRes.confirm) {
                recipeService.delete(id).then(function () {
                  wx.showToast({ title: '已删除', icon: 'success' });
                  that.loadData();
                }).catch(function (err) {
                  console.error('[我的] 删除失败:', err);
                  wx.showToast({ title: '删除失败', icon: 'none' });
                });
              }
            }
          });
        }
      }
    });
  }
});
