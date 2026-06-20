/**
 * 我的页面 - 云开发适配版
 */

var dataHelper = require('../../utils/dataHelper.js');

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
    likeBadge: null,
    loading: false
  },

  onLoad: function () {
    this.loadData();
  },

  onShow: function () {
    this.loadData();
  },

  loadData: function () {
    var that = this;
    that.setData({ loading: true });

    // 使用 dataHelper 统一加载数据
    Promise.all([
      dataHelper.getMyRecipes().catch(function () { return []; }),
      dataHelper.getFavorites().catch(function () { return []; }),
      dataHelper.getHistory().catch(function () { return []; }),
      dataHelper.getNotifications().catch(function () { return []; }),
      dataHelper.getUserInfo().catch(function () { return null; })
    ]).then(function (results) {
      var myRecipes = results[0] || [];
      var favorites = results[1] || [];
      var historyList = results[2] || [];
      var notifications = results[3] || [];
      var userInfo = results[4];

      // 计算总点赞数
      var totalLikes = 0;
      for (var i = 0; i < myRecipes.length; i++) {
        totalLikes += myRecipes[i].likes || 0;
      }

      // 计算未读通知数
      var unreadCount = 0;
      for (var j = 0; j < notifications.length; j++) {
        if (!notifications[j].read) unreadCount++;
      }

      // 提取徽章信息
      var uploadBadge = null;
      var likeBadge = null;
      if (userInfo && userInfo.badges) {
        var badges = userInfo.badges;
        // 根据等级查找对应的徽章信息
        var UPLOAD_TIERS = [
          { level: 1, count: 1, name: '厨房新手', emoji: '🌱' },
          { level: 2, count: 5, name: '家庭厨师', emoji: '🍳' },
          { level: 3, count: 15, name: '美食达人', emoji: '👨‍🍳' },
          { level: 4, count: 30, name: '厨神', emoji: '🏅' }
        ];
        var LIKE_TIERS = [
          { level: 1, count: 5, name: '伯乐初现', emoji: '❤️' },
          { level: 2, count: 20, name: '赞美之王', emoji: '🔥' },
          { level: 3, count: 50, name: '知心评委', emoji: '⭐' },
          { level: 4, count: 100, name: '超级点赞官', emoji: '💎' }
        ];
        
        for (var u = 0; u < UPLOAD_TIERS.length; u++) {
          if (UPLOAD_TIERS[u].level === badges.uploadLevel) {
            uploadBadge = UPLOAD_TIERS[u];
            break;
          }
        }
        for (var l = 0; l < LIKE_TIERS.length; l++) {
          if (LIKE_TIERS[l].level === badges.likeLevel) {
            likeBadge = LIKE_TIERS[l];
            break;
          }
        }
      }

      that.setData({
        userInfo: userInfo || { nickName: '美食爱好者', avatar: '' },
        stats: {
          recipeCount: myRecipes.length,
          favoriteCount: favorites.length,
          likeCount: totalLikes
        },
        myRecipes: myRecipes,
        favorites: favorites,
        history: historyList,
        notifications: notifications.slice(0, 5), // 只显示前5条
        unreadCount: unreadCount,
        uploadBadge: uploadBadge,
        likeBadge: likeBadge,
        loading: false
      });
    }).catch(function (e) {
      console.error('[我的] 数据加载失败:', e);
      that.setData({ loading: false });
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
    dataHelper.markNotificationRead(id).then(function () {
      that.loadData();
    }).catch(function () {
      that.loadData();
    });
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
                dataHelper.deleteRecipe(id).then(function () {
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
