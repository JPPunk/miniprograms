/**
 * 存储层抽象
 * 统一封装 wx.storage，便于后续替换为云开发或后端接口
 */

const STORAGE_KEY = {
  RECIPES: 'recipes',
  MY_RECIPES: 'myRecipes',
  FAVORITES: 'favorites',
  HISTORY: 'history',
  NOTIFICATIONS: 'notifications',
  USER_INFO: 'userInfo',
  SETTINGS: 'settings'
};

function get(key, defaultValue = null) {
  try {
    return wx.getStorageSync(key) || defaultValue;
  } catch (e) {
    console.error(`[Storage] get ${key} failed:`, e);
    return defaultValue;
  }
}

function set(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (e) {
    console.error(`[Storage] set ${key} failed:`, e);
    return false;
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (e) {
    console.error(`[Storage] remove ${key} failed:`, e);
    return false;
  }
}

function clear() {
  try {
    wx.clearStorageSync();
    return true;
  } catch (e) {
    console.error('[Storage] clear failed:', e);
    return false;
  }
}

module.exports = {
  STORAGE_KEY,
  get,
  set,
  remove,
  clear
};
