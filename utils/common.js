/**
 * 通用工具函数
 * 微信运行时兼容：module.exports 整体赋值
 */

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function now() {
  return Date.now();
}

function formatPrice(price) {
  var num = parseFloat(price);
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

function pick(object, keys) {
  var obj = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
  }
  return obj;
}

module.exports = {
  generateId: generateId,
  now: now,
  formatPrice: formatPrice,
  clamp: clamp,
  pick: pick
};
