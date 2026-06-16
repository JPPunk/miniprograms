/**
 * 云数据库抽象层
 * 封装 wx.cloud.database()，云开发不可用时自动降级为 wx.storage 本地存储
 * 微信运行时兼容：全部用 var，module.exports 整体赋值，不使用 async/await
 */

var forceLocal = true;
var LOCAL_KEY = 'local_db_';

function setForceLocal(val) {
  forceLocal = val;
}

function isCloudAvailable() {
  if (forceLocal) return false;
  try {
    if (!wx.cloud) return false;
    wx.cloud.database();
    return true;
  } catch (e) {
    return false;
  }
}

var COLLECTIONS = {
  RECIPES: 'recipes',
  USERS: 'users'
};

function localGetAll(collection) {
  try {
    var data = wx.getStorageSync(LOCAL_KEY + collection);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function localSaveAll(collection, list) {
  wx.setStorageSync(LOCAL_KEY + collection, list);
}

function localGenerateId() {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getAll(collection, where, order, limit) {
  where = where || {};
  limit = limit || 100;
  if (isCloudAvailable()) {
    try {
      var db = wx.cloud.database();
      var col = db.collection(collection);
      var query = col.where(where);
      if (order) query = query.orderBy(order.field, order.order || 'desc');
      return query.limit(limit).get().then(function (res) {
        return res.data;
      }).catch(function (e) {
        console.warn('[Storage] 云查询失败，降级到本地:', e);
        forceLocal = true;
        return localGetAllFiltered(collection, where, order, limit);
      });
    } catch (e) {
      console.warn('[Storage] 云查询异常，降级到本地:', e);
      forceLocal = true;
    }
  }
  return Promise.resolve(localGetAllFiltered(collection, where, order, limit));
}

function localGetAllFiltered(collection, where, order, limit) {
  var list = localGetAll(collection);
  var keys = Object.keys(where);
  if (keys.length > 0) {
    list = list.filter(function (item) {
      return keys.every(function (key) { return item[key] === where[key]; });
    });
  }
  if (order) {
    list.sort(function (a, b) {
      var va = a[order.field] || 0;
      var vb = b[order.field] || 0;
      return order.order === 'asc' ? va - vb : vb - va;
    });
  }
  if (limit) list = list.slice(0, limit);
  return list;
}

function getById(collection, id) {
  if (isCloudAvailable()) {
    try {
      var db = wx.cloud.database();
      return db.collection(collection).doc(id).get().then(function (res) {
        return res.data;
      }).catch(function (e) {
        if (e.errCode === -1 || (e.errMsg && e.errMsg.indexOf('not exist') > -1)) return null;
        console.warn('[Storage] 云查询失败，降级到本地:', e);
        forceLocal = true;
        return localGetById(collection, id);
      });
    } catch (e) {
      console.warn('[Storage] 云查询异常，降级到本地:', e);
      forceLocal = true;
    }
  }
  return Promise.resolve(localGetById(collection, id));
}

function localGetById(collection, id) {
  var list = localGetAll(collection);
  for (var i = 0; i < list.length; i++) {
    if (list[i]._id === id) return list[i];
  }
  return null;
}

function add(collection, data) {
  if (isCloudAvailable()) {
    try {
      var db = wx.cloud.database();
      return db.collection(collection).add({ data: data }).then(function (result) {
        return result._id;
      }).catch(function (e) {
        console.warn('[Storage] 云写入失败，降级到本地:', e);
        forceLocal = true;
        return localAdd(collection, data);
      });
    } catch (e) {
      console.warn('[Storage] 云写入异常，降级到本地:', e);
      forceLocal = true;
    }
  }
  return Promise.resolve(localAdd(collection, data));
}

function localAdd(collection, data) {
  var id = localGenerateId();
  var list = localGetAll(collection);
  var item = { _id: id };
  for (var k in data) { item[k] = data[k]; }
  list.push(item);
  localSaveAll(collection, list);
  return id;
}

function update(collection, id, data) {
  if (isCloudAvailable()) {
    try {
      var db = wx.cloud.database();
      return db.collection(collection).doc(id).update({ data: data }).catch(function (e) {
        console.warn('[Storage] 云更新失败，降级到本地:', e);
        forceLocal = true;
        return localUpdate(collection, id, data);
      });
    } catch (e) {
      console.warn('[Storage] 云更新异常，降级到本地:', e);
      forceLocal = true;
    }
  }
  return Promise.resolve(localUpdate(collection, id, data));
}

function localUpdate(collection, id, data) {
  var list = localGetAll(collection);
  for (var i = 0; i < list.length; i++) {
    if (list[i]._id === id) {
      for (var k in data) { list[i][k] = data[k]; }
      break;
    }
  }
  localSaveAll(collection, list);
  return { updated: 1 };
}

function remove(collection, id) {
  if (isCloudAvailable()) {
    try {
      var db = wx.cloud.database();
      return db.collection(collection).doc(id).remove().catch(function (e) {
        console.warn('[Storage] 云删除失败，降级到本地:', e);
        forceLocal = true;
        return localRemove(collection, id);
      });
    } catch (e) {
      console.warn('[Storage] 云删除异常，降级到本地:', e);
      forceLocal = true;
    }
  }
  return Promise.resolve(localRemove(collection, id));
}

function localRemove(collection, id) {
  var list = localGetAll(collection);
  list = list.filter(function (item) { return item._id !== id; });
  localSaveAll(collection, list);
  return { removed: 1 };
}

function count(collection, where) {
  where = where || {};
  if (isCloudAvailable()) {
    try {
      var db = wx.cloud.database();
      return db.collection(collection).where(where).count().then(function (res) {
        return res.total;
      }).catch(function (e) {
        console.warn('[Storage] 云计数失败，降级到本地:', e);
        forceLocal = true;
        return localCount(collection, where);
      });
    } catch (e) {
      console.warn('[Storage] 云计数异常，降级到本地:', e);
      forceLocal = true;
    }
  }
  return Promise.resolve(localCount(collection, where));
}

function localCount(collection, where) {
  var list = localGetAll(collection);
  var keys = Object.keys(where);
  if (keys.length === 0) return list.length;
  return list.filter(function (item) {
    return keys.every(function (key) { return item[key] === where[key]; });
  }).length;
}

module.exports = {
  COLLECTIONS: COLLECTIONS,
  getAll: getAll,
  getById: getById,
  add: add,
  update: update,
  remove: remove,
  count: count,
  setForceLocal: setForceLocal
};
