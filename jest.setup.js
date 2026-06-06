/**
 * Jest 全局 Mock
 * 为小程序环境提供基础 mock
 */

global.wx = {
  getStorageSync: jest.fn(() => null),
  setStorageSync: jest.fn(),
  removeStorageSync: jest.fn(),
  clearStorageSync: jest.fn(),
  showToast: jest.fn(),
  showModal: jest.fn(),
  navigateTo: jest.fn(),
  chooseImage: jest.fn()
};
