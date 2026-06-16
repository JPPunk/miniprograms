/**
 * 排行榜服务
 * 微信运行时兼容：全部用 var，module.exports 整体赋值，不使用 async/await
 */

var _storage = null;
function _getStorage() {
  if (!_storage) _storage = require('./storage');
  return _storage;
}

var DEFAULT_LIMIT = 100;
var PREVIEW_LIMIT = 3;

function byLikes(limit) {
  limit = limit || DEFAULT_LIMIT;
  var s = _getStorage();
  return s.getAll(s.COLLECTIONS.RECIPES, {}, { field: 'likes', order: 'desc' }, limit);
}

function byPrice(limit) {
  limit = limit || DEFAULT_LIMIT;
  var s = _getStorage();
  return s.getAll(s.COLLECTIONS.RECIPES, {}, { field: 'totalPrice', order: 'asc' }, limit);
}

function byValue(limit) {
  limit = limit || DEFAULT_LIMIT;
  var s = _getStorage();
  var nowMs = Date.now();
  var oneMonthAgo = nowMs - 30 * 24 * 60 * 60 * 1000;
  return s.getAll(s.COLLECTIONS.RECIPES, {}, { field: 'uploadTime', order: 'desc' }, limit * 2).then(function (recipes) {
    var result = [];
    for (var i = 0; i < recipes.length; i++) {
      var r = recipes[i];
      if ((r.uploadTime || 0) >= oneMonthAgo) {
        var price = parseFloat(r.totalPrice) || 1;
        var copy = {};
        for (var k in r) { copy[k] = r[k]; }
        copy.valueScore = (r.likes || 0) / price;
        result.push(copy);
      }
    }
    result.sort(function (a, b) { return b.valueScore - a.valueScore; });
    return result.slice(0, limit);
  });
}

function byTime(limit) {
  limit = limit || DEFAULT_LIMIT;
  var s = _getStorage();
  return s.getAll(s.COLLECTIONS.RECIPES, {}, { field: 'uploadTime', order: 'desc' }, limit);
}

function getDisplayList(list, expanded, limit) {
  limit = limit || PREVIEW_LIMIT;
  return expanded ? list : list.slice(0, limit);
}

module.exports = {
  byLikes: byLikes,
  byPrice: byPrice,
  byValue: byValue,
  byTime: byTime,
  getDisplayList: getDisplayList
};
