/**
 * 徽章奖励服务
 * 微信运行时兼容：全部用 var，module.exports 整体赋值，不使用 async/await
 */

var _storage = null;
function _getStorage() {
  if (!_storage) _storage = require('./storage');
  return _storage;
}

var _userService = null;
function _getUserService() {
  if (!_userService) _userService = require('./userService');
  return _userService;
}

// 菜谱上传徽章分级
var UPLOAD_TIERS = [
  { level: 1, count: 1,  name: '厨房新手', emoji: '\uD83C\uDF31', desc: '上传了第一个菜谱，迈出美食创作第一步！' },
  { level: 2, count: 5,  name: '家庭厨师', emoji: '\uD83C\uDF73', desc: '已上传5个菜谱，厨艺日渐精进！' },
  { level: 3, count: 15, name: '美食达人', emoji: '\uD83D\uDC68\u200D\uD83C\uDF73', desc: '已上传15个菜谱，堪称美食达人！' },
  { level: 4, count: 30, name: '厨神',     emoji: '\uD83C\uDFC5', desc: '已上传30个菜谱，封神之路！' }
];

// 点赞徽章分级
var LIKE_TIERS = [
  { level: 1, count: 5,   name: '伯乐初现',   emoji: '\u2764\uFE0F', desc: '给别人点了5个赞，善于发现好菜谱！' },
  { level: 2, count: 20,  name: '赞美之王',   emoji: '\uD83D\uDD25', desc: '已点20个赞，点赞狂魔！' },
  { level: 3, count: 50,  name: '知心评委',   emoji: '\u2B50', desc: '已点50个赞，专业美食评审！' },
  { level: 4, count: 100, name: '超级点赞官', emoji: '\uD83D\uDC8E', desc: '已点100个赞，点赞界的传奇！' }
];

function getCurrentUser() {
  var app = getApp();
  if (app && app.globalData && app.globalData.userInfo) {
    return app.globalData.userInfo;
  }
  return { id: 'test_user', name: '我' };
}

function _ensureUser(userId) {
  var s = _getStorage();
  return s.getById(s.COLLECTIONS.USERS, userId).then(function (userDoc) {
    if (userDoc) return userDoc;
    // 用户不存在，创建默认文档
    var defaultDoc = {
      _id: userId,
      nickName: '美食爱好者',
      role: 'user',
      myRecipes: [],
      history: [],
      favorites: [],
      notifications: [],
      badges: { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 },
      likedRecipes: []
    };
    return s.add(s.COLLECTIONS.USERS, defaultDoc).then(function (id) {
      defaultDoc._id = id;
      return defaultDoc;
    });
  });
}

function _getBadges(userId) {
  return _ensureUser(userId).then(function (userDoc) {
    if (!userDoc.badges) {
      userDoc.badges = { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 };
    }
    return userDoc.badges;
  });
}

/**
 * 检查上传徽章，返回 { upgraded, newLevel, badge }
 */
function checkUploadBadge(userId) {
  var uid = userId || getCurrentUser().id;
  var s = _getStorage();

  return _ensureUser(uid).then(function (userDoc) {
    var badges = userDoc.badges || { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 };

    // 计算实际上传数：优先用 myRecipes 数组，否则从缓存取
    var uploadCount = 0;
    if (userDoc.myRecipes && userDoc.myRecipes.length > 0) {
      uploadCount = userDoc.myRecipes.length;
    } else {
      uploadCount = badges.uploadCount || 0;
    }

    // 找到当前应达到的最高等级
    var newLevel = 0;
    var newBadge = null;
    for (var i = UPLOAD_TIERS.length - 1; i >= 0; i--) {
      if (uploadCount >= UPLOAD_TIERS[i].count) {
        newLevel = UPLOAD_TIERS[i].level;
        newBadge = UPLOAD_TIERS[i];
        break;
      }
    }

    var upgraded = newLevel > badges.uploadLevel;

    if (upgraded) {
      badges.uploadLevel = newLevel;
      badges.uploadCount = uploadCount;
      return s.update(s.COLLECTIONS.USERS, uid, { badges: badges }).then(function () {
        return { upgraded: true, newLevel: newLevel, badge: newBadge };
      });
    }

    return { upgraded: false, newLevel: badges.uploadLevel, badge: null };
  });
}

/**
 * 检查点赞徽章，返回 { upgraded, newLevel, badge }
 */
function checkLikeBadge(userId) {
  var uid = userId || getCurrentUser().id;
  var s = _getStorage();

  return _ensureUser(uid).then(function (userDoc) {
    var badges = userDoc.badges || { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 };
    var likeCount = badges.likeCount || 0;

    // 找到当前应达到的最高等级
    var newLevel = 0;
    var newBadge = null;
    for (var i = LIKE_TIERS.length - 1; i >= 0; i--) {
      if (likeCount >= LIKE_TIERS[i].count) {
        newLevel = LIKE_TIERS[i].level;
        newBadge = LIKE_TIERS[i];
        break;
      }
    }

    var upgraded = newLevel > badges.likeLevel;

    if (upgraded) {
      badges.likeLevel = newLevel;
      badges.likeCount = likeCount;
      return s.update(s.COLLECTIONS.USERS, uid, { badges: badges }).then(function () {
        return { upgraded: true, newLevel: newLevel, badge: newBadge };
      });
    }

    return { upgraded: false, newLevel: badges.likeLevel, badge: null };
  });
}

/**
 * 获取用户徽章展示信息
 */
function getUserBadges(userId) {
  var uid = userId || getCurrentUser().id;
  var s = _getStorage();

  return Promise.all([
    _ensureUser(uid),
    s.getAll(s.COLLECTIONS.RECIPES, { authorId: uid })
  ]).then(function (results) {
    var userDoc = results[0];
    var userRecipes = results[1] || [];
    var badges = userDoc.badges || { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 };

    // 以实际菜谱数为准，避免缓存不同步
    var realUploadCount = userRecipes.length;
    var uploadBadge = null;
    var likeBadge = null;

    for (var i = UPLOAD_TIERS.length - 1; i >= 0; i--) {
      if (realUploadCount >= UPLOAD_TIERS[i].count) {
        uploadBadge = UPLOAD_TIERS[i];
        break;
      }
    }

    for (var j = LIKE_TIERS.length - 1; j >= 0; j--) {
      if ((badges.likeCount || 0) >= LIKE_TIERS[j].count) {
        likeBadge = LIKE_TIERS[j];
        break;
      }
    }

    // 同步更新缓存的 uploadCount 和 uploadLevel
    if (realUploadCount !== (badges.uploadCount || 0) || (uploadBadge && uploadBadge.level !== badges.uploadLevel)) {
      badges.uploadCount = realUploadCount;
      if (uploadBadge) badges.uploadLevel = uploadBadge.level;
      s.update(s.COLLECTIONS.USERS, uid, { badges: badges }).catch(function () {});
    }

    return {
      uploadBadge: uploadBadge,
      likeBadge: likeBadge,
      uploadCount: realUploadCount,
      likeCount: badges.likeCount || 0
    };
  });
}

/**
 * 点赞时递增用户计数并记录菜谱
 */
function onLikeGiven(userId, recipeId) {
  var uid = userId || getCurrentUser().id;
  var s = _getStorage();

  return _ensureUser(uid).then(function (userDoc) {
    var badges = userDoc.badges || { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 };
    var likedRecipes = userDoc.likedRecipes || [];

    // 避免重复记录
    if (likedRecipes.indexOf(recipeId) === -1) {
      likedRecipes.push(recipeId);
      badges.likeCount = likedRecipes.length;

      return s.update(s.COLLECTIONS.USERS, uid, {
        badges: badges,
        likedRecipes: likedRecipes
      });
    }
    return null;
  });
}

/**
 * 取消点赞时递减计数并移除菜谱记录
 */
function onLikeRemoved(userId, recipeId) {
  var uid = userId || getCurrentUser().id;
  var s = _getStorage();

  return _ensureUser(uid).then(function (userDoc) {
    var badges = userDoc.badges || { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 };
    var likedRecipes = userDoc.likedRecipes || [];

    var idx = likedRecipes.indexOf(recipeId);
    if (idx > -1) {
      likedRecipes.splice(idx, 1);
      badges.likeCount = likedRecipes.length;

      return s.update(s.COLLECTIONS.USERS, uid, {
        badges: badges,
        likedRecipes: likedRecipes
      });
    }
    return null;
  });
}

/**
 * 上传菜谱后递增计数
 */
function onRecipeUploaded(userId, recipeId) {
  var uid = userId || getCurrentUser().id;
  var s = _getStorage();

  return _ensureUser(uid).then(function (userDoc) {
    var badges = userDoc.badges || { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 };
    var myRecipes = userDoc.myRecipes || [];

    if (myRecipes.indexOf(recipeId) === -1) {
      myRecipes.push(recipeId);
      badges.uploadCount = myRecipes.length;

      return s.update(s.COLLECTIONS.USERS, uid, {
        badges: badges,
        myRecipes: myRecipes
      });
    }
    return null;
  });
}

module.exports = {
  UPLOAD_TIERS: UPLOAD_TIERS,
  LIKE_TIERS: LIKE_TIERS,
  checkUploadBadge: checkUploadBadge,
  checkLikeBadge: checkLikeBadge,
  getUserBadges: getUserBadges,
  onLikeGiven: onLikeGiven,
  onLikeRemoved: onLikeRemoved,
  onRecipeUploaded: onRecipeUploaded
};
