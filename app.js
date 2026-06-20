var dataHelper = require('utils/dataHelper.js');
var storage = require('services/storage.js');

App({
  globalData: {
    openid: null,
    userInfo: {
      id: 'test_user',
      name: '我'
    },
    useCloud: false
  },

  onLaunch: function () {
    // 默认使用本地存储
    storage.setForceLocal(true);

    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: 'cloudbase-d7g0ms7t6569c7e0e',
          traceUser: true
        });
        // 验证云开发是否真正可用
        this.verifyCloud();
      } catch (e) {
        console.warn('[App] 云开发初始化失败，继续使用本地存储');
      }
    }

    this.login();
    this.initData();
  },

  verifyCloud: function () {
    var self = this;
    var db = wx.cloud.database();
    db.collection('recipes').limit(1).get().then(function () {
      console.log('[App] 云开发验证通过');
      self.globalData.useCloud = true;
      storage.setForceLocal(false);
    }).catch(function () {
      console.warn('[App] 云开发不可用，继续使用本地存储');
    });
  },

  login: function () {
    if (!wx.cloud) return;

    var self = this;
    wx.cloud.callFunction({
      name: 'login'
    }).then(function (res) {
      var openid = res.result.openid;
      self.globalData.openid = openid;
      console.log('[App] 云登录成功, openid:', openid);
    }).catch(function () {
      // 静默失败，已使用本地用户
    });
  },

  initData: function () {
    var self = this;
    // 检查已有数据是否包含 test_user 的菜谱
    try {
      var recipes = wx.getStorageSync('local_db_recipes') || [];
      var hasTestUser = false;
      for (var i = 0; i < recipes.length; i++) {
        if (recipes[i].authorId === 'test_user') { hasTestUser = true; break; }
      }
      if (recipes.length > 0 && !hasTestUser) {
        console.warn('[App] 旧数据无 test_user 菜谱，清空重建');
        wx.removeStorageSync('local_db_recipes');
        wx.removeStorageSync('local_db_users');
        wx.removeStorageSync('local_db_history');
        wx.removeStorageSync('local_db_notifications');
        recipes = [];
      }
    } catch (e) {}

    dataHelper.initMockData().then(function (hasData) {
      if (hasData) {
        console.log('[App] 已初始化 Mock 数据');
      }
    }).catch(function (e) {
      console.warn('[App] 初始化数据失败:', e);
    });
  }
});
