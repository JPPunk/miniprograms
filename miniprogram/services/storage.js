/**
 * 云数据库抽象层 - 云开发适配版
 * 封装 wx.cloud.database()，云开发不可用时自动降级为 wx.storage 本地存储
 * 微信运行时兼容：全部用 var，module.exports 整体赋值，不使用 async/await
 */

var forceLocal = false; // 默认优先使用云开发
var LOCAL_KEY = 'local_db_';

// 云数据库集合名称
var COLLECTIONS = {
  RECIPES: 'recipes',
  USERS: 'users',
  NOTIFICATIONS: 'notifications',
  HISTORY: 'history'
};

function setForceLocal(val) {
  forceLocal = val;
  console.log('[Storage] 强制本地模式:', val);
}

function isCloudAvailable() {
  if (forceLocal) return false;
  try {
    if (!wx.cloud) return false;
    var db = wx.cloud.database();
    return db ? true : false;
  } catch (e) {
    return false;
  }
}

// ========== 本地存储操作 ==========
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

function localGetAllFiltered(collection, where, order, limit) {
  var list = localGetAll(collection);
  var keys = Object.keys(where || {});
  if (keys.length > 0) {
    list = list.filter(function (item) {
      return keys.every(function (key) { 
        return item[key] === where[key]; 
      });
    });
  }
  if (order && order.field) {
    list.sort(function (a, b) {
      var va = a[order.field] || 0;
      var vb = b[order.field] || 0;
      if (typeof va === 'string' && typeof vb === 'string') {
        return order.order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return order.order === 'asc' ? va - vb : vb - va;
    });
  }
  if (limit) list = list.slice(0, limit);
  return list;
}

function localGetById(collection, id) {
  var list = localGetAll(collection);
  for (var i = 0; i < list.length; i++) {
    if (list[i]._id === id) return list[i];
  }
  return null;
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

function localRemove(collection, id) {
  var list = localGetAll(collection);
  list = list.filter(function (item) { return item._id !== id; });
  localSaveAll(collection, list);
  return { removed: 1 };
}

function localCount(collection, where) {
  var list = localGetAll(collection);
  var keys = Object.keys(where || {});
  if (keys.length === 0) return list.length;
  return list.filter(function (item) {
    return keys.every(function (key) { return item[key] === where[key]; });
  }).length;
}

// ========== 云数据库操作 ==========
function cloudGetAll(collection, where, order, limit) {
  var db = wx.cloud.database();
  var query = db.collection(collection);
  
  if (where && Object.keys(where).length > 0) {
    query = query.where(where);
  }
  if (order && order.field) {
    query = query.orderBy(order.field, order.order || 'desc');
  }
  if (limit) {
    query = query.limit(limit);
  }
  
  return query.get().then(function (res) {
    return res.data || [];
  });
}

function cloudGetById(collection, id) {
  var db = wx.cloud.database();
  return db.collection(collection).doc(id).get().then(function (res) {
    return res.data;
  }).catch(function (e) {
    if (e.errCode === -1 || (e.errMsg && e.errMsg.indexOf('not exist') > -1)) {
      return null;
    }
    throw e;
  });
}

function cloudAdd(collection, data) {
  var db = wx.cloud.database();
  // 添加系统字段
  var docData = Object.assign({}, data, {
    _createTime: db.serverDate(),
    _updateTime: db.serverDate()
  });
  
  return db.collection(collection).add({
    data: docData
  }).then(function (res) {
    return res._id;
  });
}

function cloudUpdate(collection, id, data) {
  var db = wx.cloud.database();
  // 添加更新时间
  var updateData = Object.assign({}, data, {
    _updateTime: db.serverDate()
  });
  
  return db.collection(collection).doc(id).update({
    data: updateData
  });
}

function cloudRemove(collection, id) {
  var db = wx.cloud.database();
  return db.collection(collection).doc(id).remove();
}

function cloudCount(collection, where) {
  var db = wx.cloud.database();
  var query = db.collection(collection);
  if (where && Object.keys(where).length > 0) {
    query = query.where(where);
  }
  return query.count().then(function (res) {
    return res.total;
  });
}

// ========== 统一接口 ==========
function getAll(collection, where, order, limit) {
  where = where || {};
  limit = limit || 100;
  
  if (isCloudAvailable()) {
    return cloudGetAll(collection, where, order, limit).catch(function (e) {
      console.warn('[Storage] 云查询失败，降级到本地:', e);
      forceLocal = true;
      return localGetAllFiltered(collection, where, order, limit);
    });
  }
  return Promise.resolve(localGetAllFiltered(collection, where, order, limit));
}

function getById(collection, id) {
  if (isCloudAvailable()) {
    return cloudGetById(collection, id).catch(function (e) {
      console.warn('[Storage] 云查询失败，降级到本地:', e);
      forceLocal = true;
      return localGetById(collection, id);
    });
  }
  return Promise.resolve(localGetById(collection, id));
}

function add(collection, data) {
  if (isCloudAvailable()) {
    return cloudAdd(collection, data).catch(function (e) {
      console.warn('[Storage] 云写入失败，降级到本地:', e);
      forceLocal = true;
      return localAdd(collection, data);
    });
  }
  return Promise.resolve(localAdd(collection, data));
}

function update(collection, id, data) {
  if (isCloudAvailable()) {
    return cloudUpdate(collection, id, data).catch(function (e) {
      console.warn('[Storage] 云更新失败，降级到本地:', e);
      forceLocal = true;
      return localUpdate(collection, id, data);
    });
  }
  return Promise.resolve(localUpdate(collection, id, data));
}

function remove(collection, id) {
  if (isCloudAvailable()) {
    return cloudRemove(collection, id).catch(function (e) {
      console.warn('[Storage] 云删除失败，降级到本地:', e);
      forceLocal = true;
      return localRemove(collection, id);
    });
  }
  return Promise.resolve(localRemove(collection, id));
}

function count(collection, where) {
  if (isCloudAvailable()) {
    return cloudCount(collection, where).catch(function (e) {
      console.warn('[Storage] 云计数失败，降级到本地:', e);
      forceLocal = true;
      return localCount(collection, where);
    });
  }
  return Promise.resolve(localCount(collection, where));
}

// 批量操作（云开发专用）
function batchAdd(collection, docs) {
  if (!isCloudAvailable() || !docs || docs.length === 0) {
    // 本地模式：逐个添加
    var ids = [];
    var chain = Promise.resolve();
    for (var i = 0; i < docs.length; i++) {
      (function (doc) {
        chain = chain.then(function () {
          return add(collection, doc);
        }).then(function (id) {
          ids.push(id);
        });
      })(docs[i]);
    }
    return chain.then(function () { return ids; });
  }
  
  // 云模式：使用云函数批量添加
  return wx.cloud.callFunction({
    name: 'recipes',
    data: {
      action: 'batchAdd',
      collection: collection,
      docs: docs
    }
  }).then(function (res) {
    return res.result && res.result.ids ? res.result.ids : [];
  }).catch(function (e) {
    console.warn('[Storage] 批量添加失败:', e);
    return [];
  });
}

// 聚合查询（云开发专用）
function aggregate(collection, pipeline) {
  if (!isCloudAvailable()) {
    return Promise.resolve([]);
  }
  
  var db = wx.cloud.database();
  var agg = db.collection(collection).aggregate();
  
  // 支持简单的聚合操作
  if (pipeline && pipeline.length > 0) {
    for (var i = 0; i < pipeline.length; i++) {
      var stage = pipeline[i];
      if (stage.match) {
        agg = agg.match(stage.match);
      }
      if (stage.sort) {
        agg = agg.sort(stage.sort);
      }
      if (stage.limit) {
        agg = agg.limit(stage.limit);
      }
    }
  }
  
  return agg.end().then(function (res) {
    return res.list || [];
  }).catch(function (e) {
    console.warn('[Storage] 聚合查询失败:', e);
    return [];
  });
}

module.exports = {
  COLLECTIONS: COLLECTIONS,
  getAll: getAll,
  getById: getById,
  add: add,
  update: update,
  remove: remove,
  count: count,
  batchAdd: batchAdd,
  aggregate: aggregate,
  setForceLocal: setForceLocal,
  isCloudAvailable: function() { return isCloudAvailable(); }
};
