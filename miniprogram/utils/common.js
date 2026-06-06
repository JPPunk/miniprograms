/**
 * 通用工具函数
 */

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function now() {
  return Date.now();
}

function formatPrice(price) {
  const num = parseFloat(price);
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

function pick(object, keys) {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
}

module.exports = {
  generateId,
  now,
  formatPrice,
  clamp,
  pick
};
