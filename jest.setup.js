/**
 * Jest 全局 Mock
 * 为小程序环境提供基础 mock
 */

// Mock getApp
global.getApp = jest.fn(() => ({
  globalData: {
    openid: 'test_user',
    userInfo: {
      id: 'test_user',
      name: '我'
    }
  }
}));

global.wx = {
  getStorageSync: jest.fn(() => null),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  clearStorageSync: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  showActionSheet: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  chooseImage: jest.fn(),
  cloud: {
    init: jest.fn(),
    database: jest.fn(() => { throw new Error('Cloud not available in test'); }),
    callFunction: jest.fn().mockResolvedValue({ result: { openid: 'test_user' } })
  }
};
