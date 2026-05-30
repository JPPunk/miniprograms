var dataHelper = require('../../utils/dataHelper.js');

Page({
  data: {
    userInfo: {
      nickName: '美食爱好者',
      avatar: ''
    },
    stats: {
      recipeCount: 0,
      favoriteCount: 0,
      likeCount: 0
    },
    currentTab: 'recipes',
    myRecipes: [],
    favorites: [],
    history: [],
    notifications: [],
    unreadCount: 0,
    settings: [
      { id: 'notifications', icon: '🔔', title: '消息通知', desc: '点赞提醒', switch: true, switchKey: 'notifyEnabled' },
      { id: 'about', icon: 'ℹ️', title: '关于小程序', desc: '版本信息', arrow: true }
    ],
    notifyEnabled: true
  },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  loadData: function() {
    const myRecipes = dataHelper.getMyRecipes();
    const favorites = dataHelper.getFavorites('test_user');
    const history = dataHelper.getHistory();
    const notifications = dataHelper.getNotifications();

    let totalLikes = 0;
    myRecipes.forEach(r => totalLikes += r.likes || 0);

    this.setData({
      stats: {
        recipeCount: myRecipes.length,
        favoriteCount: favorites.length,
        likeCount: totalLikes
      },
      myRecipes: myRecipes,
      favorites: favorites,
      history: history,
      notifications: notifications,
      unreadCount: dataHelper.getUnreadCount()
    });
  },

  onTabChange: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  onMenuTap: function(e) {
    const id = e.currentTarget.dataset.id;

    if (id === 'about') {
      wx.showModal({
        title: '关于划算小厨',
        content: '版本：1.0.0\n一个帮你计算菜谱成本的小程序',
        showCancel: false
      });
    }
  },

  onNotificationTap: function(e) {
    const id = e.currentTarget.dataset.id;
    dataHelper.markNotificationRead(id);
    this.loadData();
  },

  onSwitchChange: function(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [key]: e.detail.value });
    wx.showToast({
      title: e.detail.value ? '已开启' : '已关闭',
      icon: 'success',
      duration: 1000
    });
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    dataHelper.addToHistory(id);
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + id
    });
  },

  goToNotificationList: function() {
    wx.navigateTo({
      url: '/pages/notifications/notifications'
    });
  }
});