var dataHelper = require('utils/dataHelper.js');
var storage = require('services/storage.js');

// 云开发环境配置
var CLOUD_ENV = 'cloudbase-d7g0ms7t6569c7e0e';

App({
  globalData: {
    openid: null,
    userInfo: {
      id: 'test_user',
      name: '我'
    },
    useCloud: false,
    cloudEnv: CLOUD_ENV
  },

  onLaunch: function () {
    var self = this;
    
    // 初始化云开发
    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: CLOUD_ENV,
          traceUser: true
        });
        console.log('[App] 云开发初始化，环境:', CLOUD_ENV);
        
        // 验证云开发是否真正可用
        self.verifyCloud();
      } catch (e) {
        console.warn('[App] 云开发初始化失败，降级到本地存储:', e);
        storage.setForceLocal(true);
      }
    } else {
      console.warn('[App] 不支持云开发，使用本地存储');
      storage.setForceLocal(true);
    }

    this.login();
    this.initData();
  },

  verifyCloud: function () {
    var self = this;
    wx.cloud.callFunction({
      name: 'login',
      data: { action: 'verify' }
    }).then(function (res) {
      if (res.result && res.result.success) {
        console.log('[App] 云开发验证通过，环境:', res.result.env);
        self.globalData.useCloud = true;
        storage.setForceLocal(false);
        
        // 同步云端用户数据
        self.syncUserData(res.result.openid);
      } else {
        throw new Error('云验证失败');
      }
    }).catch(function (err) {
      console.warn('[App] 云开发验证失败，降级到本地存储:', err);
      storage.setForceLocal(true);
    });
  },

  login: function () {
    if (!wx.cloud) return;

    var self = this;
    wx.cloud.callFunction({
      name: 'login',
      data: { action: 'login' }
    }).then(function (res) {
      if (res.result && res.result.openid) {
        var openid = res.result.openid;
        self.globalData.openid = openid;
        self.globalData.userInfo.id = openid;
        console.log('[App] 云登录成功, openid:', openid);
      }
    }).catch(function (err) {
      console.warn('[App] 云登录失败:', err);
    });
  },

  syncUserData: function (openid) {
    // 同步云端用户数据到本地
    var self = this;
    wx.cloud.callFunction({
      name: 'users',
      data: {
        action: 'getUserInfo',
        userId: openid
      }
    }).then(function (res) {
      if (res.result && res.result.success && res.result.data) {
        console.log('[App] 用户数据同步成功');
        self.globalData.userInfo = res.result.data;
      }
    }).catch(function () {
      // 静默失败
    });
  },

  initData: function () {
    var self = this;
    
    // 检查本地数据状态
    try {
      var recipes = wx.getStorageSync('local_db_recipes') || [];
      if (recipes.length === 0 && !self.globalData.useCloud) {
        // 本地无数据且云开发不可用，初始化 Mock 数据
        dataHelper.initMockData().then(function (hasData) {
          if (hasData) {
            console.log('[App] 已初始化本地 Mock 数据');
          }
        }).catch(function (e) {
          console.warn('[App] 初始化数据失败:', e);
        });
      } else if (self.globalData.useCloud) {
        console.log('[App] 使用云数据库，跳过本地 Mock 数据');
      }
    } catch (e) {
      console.warn('[App] 检查本地数据失败:', e);
    }
  }
});
