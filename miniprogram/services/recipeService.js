/**
 * 菜谱服务
 * 微信运行时兼容：全部用 var，module.exports 整体赋值，不使用 async/await
 */

var _storage = null;
function _getStorage() {
  if (!_storage) _storage = require('./storage');
  return _storage;
}
var _common = null;
function _getCommon() {
  if (!_common) _common = require('../utils/common');
  return _common;
}
var _userService = null;
function _getUserService() {
  if (!_userService) _userService = require('./userService');
  return _userService;
}
var _notificationService = null;
function _getNotificationService() {
  if (!_notificationService) _notificationService = require('./notificationService');
  return _notificationService;
}
var _badgeService = null;
function _getBadgeService() {
  if (!_badgeService) _badgeService = require('./badgeService');
  return _badgeService;
}

function getCurrentUser() {
  var app = getApp();
  if (app && app.globalData && app.globalData.userInfo) {
    return app.globalData.userInfo;
  }
  return { id: 'test_user', name: '我' };
}

function getAllRecipes() {
  var s = _getStorage();
  return s.getAll(s.COLLECTIONS.RECIPES, {}, { field: 'uploadTime', order: 'desc' });
}

function getRecipeById(id) {
  var s = _getStorage();
  return s.getById(s.COLLECTIONS.RECIPES, id);
}

function saveRecipe(recipeInput) {
  var s = _getStorage();
  var c = _getCommon();
  var user = getCurrentUser();
  var recipe = {
    name: recipeInput.name.trim(),
    emoji: recipeInput.emoji || '\uD83C\uDF7D\uFE0F',
    authorId: user.id,
    authorName: user.name,
    createTime: new Date().toLocaleDateString('zh-CN'),
    uploadTime: c.now(),
    totalPrice: c.formatPrice(recipeInput.totalPrice),
    dishImages: recipeInput.dishImages || [],
    ingredientItems: (recipeInput.ingredientItems || []).filter(function (i) { return i.name.trim(); }),
    steps: (recipeInput.steps || []).filter(function (s) { return s.content.trim(); }),
    likes: 0,
    likedUsers: [],
    status: 'published'
  };

  return s.add(s.COLLECTIONS.RECIPES, recipe).then(function (_id) {
    recipe._id = _id;
    var us = _getUserService();
    return us.updateMyRecipes(_id);
  }).then(function () {
    return recipe;
  });
}

function updateRecipe(recipe) {
  var s = _getStorage();
  return s.update(s.COLLECTIONS.RECIPES, recipe._id, recipe).then(function () {
    return recipe;
  });
}

function toggleLike(recipeId, userId) {
  var user = getCurrentUser();
  var uid = userId || user.id;
  return getRecipeById(recipeId).then(function (recipe) {
    if (!recipe) return null;

    if (!recipe.likedUsers) recipe.likedUsers = [];

    var userIndex = recipe.likedUsers.indexOf(uid);
    var isLiked = userIndex > -1;

    if (isLiked) {
      recipe.likedUsers.splice(userIndex, 1);
      recipe.likes = Math.max(0, (recipe.likes || 0) - 1);
    } else {
      recipe.likedUsers.push(uid);
      recipe.likes = (recipe.likes || 0) + 1;
    }

    return updateRecipe(recipe).then(function () {
      var bs = _getBadgeService();
      if (!isLiked) {
        // 点赞：记录点赞并检查徽章
        return bs.onLikeGiven(uid, recipeId).then(function () {
          return bs.checkLikeBadge(uid);
        }).then(function (result) {
          if (!isLiked && recipe.authorId !== uid) {
            var ns = _getNotificationService();
            return ns.addNotification({
              type: 'like',
              recipeId: recipeId,
              recipeName: recipe.name,
              message: '\u6709\u4EBA\u70B9\u8D5E\u4E86\u4F60\u7684\u83DC\u8C31',
              userId: recipe.authorId
            }).catch(function () { /* notification failure is not critical */ });
          }
        }).then(function () {
          return { recipe: recipe, isLiked: true, badgeUpgraded: true };
        });
      } else {
        // 取消点赞
        return bs.onLikeRemoved(uid, recipeId).then(function () {
          if (recipe.authorId !== uid) {
            var ns = _getNotificationService();
            return ns.addNotification({
              type: 'like',
              recipeId: recipeId,
              recipeName: recipe.name,
              message: '\u6709\u4EBA\u70B9\u8D5E\u4E86\u4F60\u7684\u83DC\u8C31',
              userId: recipe.authorId
            }).catch(function () {});
          }
        }).then(function () {
          return { recipe: recipe, isLiked: false, badgeUpgraded: false };
        });
      }
    });
  });
}

function isRecipeLiked(recipeId, userId) {
  var user = getCurrentUser();
  var uid = userId || user.id;
  return getRecipeById(recipeId).then(function (recipe) {
    if (!recipe || !recipe.likedUsers) return false;
    return recipe.likedUsers.indexOf(uid) > -1;
  });
}

function getMyRecipes() {
  var user = getCurrentUser();
  return getAllRecipes().then(function (allRecipes) {
    return allRecipes.filter(function (r) { return r.authorId === user.id; });
  });
}

function getFavorites(userId) {
  var user = getCurrentUser();
  var uid = userId || user.id;
  return getAllRecipes().then(function (allRecipes) {
    return allRecipes.filter(function (r) { return r.likedUsers && r.likedUsers.indexOf(uid) > -1; });
  });
}

function initMockData() {
  var s = _getStorage();
  var c = _getCommon();
  return s.count(s.COLLECTIONS.RECIPES).then(function (cnt) {
    if (cnt > 0) return false;

    var current = c.now();
    var day = 24 * 60 * 60 * 1000;

    // 10 道家常菜，不同作者、不同价位、不同热度
    var mockRecipes = [
      // 1. 红烧肉 — 经典硬菜，高赞（归属 test_user，"我的"页面可见）
      {
        name: '红烧肉', emoji: '🥩',
        authorId: 'test_user', authorName: '我',
        createTime: '2026/5/1', uploadTime: current - 30 * day,
        totalPrice: '42.80',
        dishImages: [],
        ingredientItems: [
          { name: '五花肉', qty: '500', unit: '克(g)', price: '28.00', image: '' },
          { name: '冰糖', qty: '30', unit: '克(g)', price: '3.00', image: '' },
          { name: '生抽', qty: '2', unit: '勺', price: '2.00', image: '' },
          { name: '老抽', qty: '1', unit: '勺', price: '1.50', image: '' },
          { name: '料酒', qty: '2', unit: '勺', price: '2.00', image: '' },
          { name: '八角', qty: '2', unit: '颗', price: '0.80', image: '' },
          { name: '姜片', qty: '3', unit: '片', price: '0.50', image: '' },
          { name: '葱段', qty: '2', unit: '根', price: '1.00', image: '' }
        ],
        steps: [
          { content: '五花肉切2cm方块，冷水下锅焯水3分钟，捞出沥干', image: '' },
          { content: '锅中少许油，放冰糖小火炒至枣红色起泡', image: '' },
          { content: '放入五花肉翻炒上色，加姜片、葱段、八角', image: '' },
          { content: '加料酒、生抽、老抽，倒入没过肉的热水', image: '' },
          { content: '大火烧开转小火炖50分钟，最后大火收汁', image: '' }
        ],
        likes: 256, likedUsers: ['user_lisi', 'user_wangwu', 'user_zhaoliu'], status: 'published'
      },
      // 2. 番茄炒蛋 — 国民家常菜，超高赞
      {
        name: '番茄炒蛋', emoji: '🍳',
        authorId: 'user_lisi', authorName: '李四',
        createTime: '2026/5/3', uploadTime: current - 28 * day,
        totalPrice: '9.50',
        dishImages: [],
        ingredientItems: [
          { name: '番茄', qty: '2', unit: '个', price: '4.00', image: '' },
          { name: '鸡蛋', qty: '3', unit: '颗', price: '3.00', image: '' },
          { name: '食用油', qty: '2', unit: '勺', price: '1.00', image: '' },
          { name: '白砂糖', qty: '1', unit: '勺', price: '0.50', image: '' },
          { name: '盐', qty: '1', unit: '少许', price: '0.20', image: '' },
          { name: '葱花', qty: '1', unit: '把', price: '0.80', image: '' }
        ],
        steps: [
          { content: '番茄顶部划十字，开水烫30秒去皮，切块', image: '' },
          { content: '鸡蛋加少许盐打散，锅中油热后倒入，快速滑散盛出', image: '' },
          { content: '锅中少许油，倒入番茄块翻炒出汁', image: '' },
          { content: '加白砂糖、盐调味，倒回鸡蛋翻炒均匀', image: '' },
          { content: '撒葱花出锅', image: '' }
        ],
        likes: 312, likedUsers: ['user_zhangsan', 'user_wangwu', 'test_user'], status: 'published'
      },
      // 3. 宫保鸡丁 — 经典川菜
      {
        name: '宫保鸡丁', emoji: '🌶️',
        authorId: 'user_wangwu', authorName: '王五',
        createTime: '2026/5/5', uploadTime: current - 25 * day,
        totalPrice: '28.60',
        dishImages: [],
        ingredientItems: [
          { name: '鸡胸肉', qty: '300', unit: '克(g)', price: '12.00', image: '' },
          { name: '花生米', qty: '50', unit: '克(g)', price: '4.00', image: '' },
          { name: '干辣椒', qty: '8', unit: '根', price: '1.50', image: '' },
          { name: '花椒', qty: '1', unit: '勺', price: '0.50', image: '' },
          { name: '黄瓜', qty: '1', unit: '根', price: '2.00', image: '' },
          { name: '胡萝卜', qty: '1', unit: '根', price: '1.50', image: '' },
          { name: '生抽', qty: '2', unit: '勺', price: '2.00', image: '' },
          { name: '醋', qty: '1', unit: '勺', price: '1.00', image: '' },
          { name: '白砂糖', qty: '1', unit: '勺', price: '0.50', image: '' },
          { name: '料酒', qty: '1', unit: '勺', price: '1.00', image: '' },
          { name: '淀粉', qty: '1', unit: '勺', price: '0.80', image: '' },
          { name: '蒜末', qty: '3', unit: '颗', price: '0.80', image: '' },
          { name: '姜末', qty: '1', unit: '少许', price: '0.50', image: '' }
        ],
        steps: [
          { content: '鸡胸肉切丁，加料酒、生抽、淀粉腌制15分钟', image: '' },
          { content: '黄瓜、胡萝卜切丁备用', image: '' },
          { content: '调碗汁：生抽2勺+醋1勺+糖1勺+淀粉半勺+水3勺', image: '' },
          { content: '锅中油热，放花生米小火炸至微黄盛出', image: '' },
          { content: '锅留底油，爆香花椒、干辣椒、姜蒜末', image: '' },
          { content: '放鸡丁滑炒至变色，加胡萝卜丁翻炒1分钟', image: '' },
          { content: '倒碗汁翻炒均匀，放黄瓜丁和花生米，出锅', image: '' }
        ],
        likes: 198, likedUsers: ['user_zhangsan', 'user_lisi', 'user_zhaoliu'], status: 'published'
      },
      // 4. 麻婆豆腐 — 下饭神器
      {
        name: '麻婆豆腐', emoji: '🫕',
        authorId: 'user_zhaoliu', authorName: '赵六',
        createTime: '2026/5/7', uploadTime: current - 22 * day,
        totalPrice: '14.30',
        dishImages: [],
        ingredientItems: [
          { name: '嫩豆腐', qty: '1', unit: '块', price: '4.00', image: '' },
          { name: '猪肉末', qty: '100', unit: '克(g)', price: '6.00', image: '' },
          { name: '豆瓣酱', qty: '1', unit: '勺', price: '1.50', image: '' },
          { name: '花椒粉', qty: '1', unit: '少许', price: '0.50', image: '' },
          { name: '蒜末', qty: '3', unit: '颗', price: '0.80', image: '' },
          { name: '豆豉', qty: '1', unit: '勺', price: '0.50', image: '' },
          { name: '葱花', qty: '1', unit: '把', price: '0.50', image: '' },
          { name: '淀粉水', qty: '1', unit: '勺', price: '0.30', image: '' },
          { name: '食用油', qty: '2', unit: '勺', price: '0.20', image: '' }
        ],
        steps: [
          { content: '嫩豆腐切2cm方块，开水加盐焯2分钟，沥干备用', image: '' },
          { content: '锅中油热，放猪肉末炒至变色出油', image: '' },
          { content: '加豆瓣酱、豆豉炒出红油，放蒜末爆香', image: '' },
          { content: '加适量热水烧开，轻轻放入豆腐，中火煮3分钟', image: '' },
          { content: '淋水淀粉勾薄芡，撒花椒粉、葱花出锅', image: '' }
        ],
        likes: 186, likedUsers: ['user_zhangsan', 'user_lisi', 'test_user'], status: 'published'
      },
      // 5. 蒜蓉西兰花 — 清淡素菜
      {
        name: '蒜蓉西兰花', emoji: '🥦',
        authorId: 'user_qianqi', authorName: '钱七',
        createTime: '2026/5/9', uploadTime: current - 20 * day,
        totalPrice: '8.20',
        dishImages: [],
        ingredientItems: [
          { name: '西兰花', qty: '1', unit: '颗', price: '5.00', image: '' },
          { name: '蒜', qty: '6', unit: '颗', price: '1.20', image: '' },
          { name: '蚝油', qty: '1', unit: '勺', price: '1.00', image: '' },
          { name: '盐', qty: '1', unit: '少许', price: '0.20', image: '' },
          { name: '食用油', qty: '1', unit: '勺', price: '0.50', image: '' },
          { name: '水淀粉', qty: '1', unit: '勺', price: '0.30', image: '' }
        ],
        steps: [
          { content: '西兰花掰小朵，淡盐水浸泡15分钟，洗净沥干', image: '' },
          { content: '烧开水加少许盐和几滴油，西兰花焯水1分钟捞出', image: '' },
          { content: '蒜切末，锅中油热放一半蒜末爆香', image: '' },
          { content: '放西兰花大火翻炒，加蚝油、盐调味', image: '' },
          { content: '淋水淀粉勾芡，撒剩余蒜末，翻匀出锅', image: '' }
        ],
        likes: 78, likedUsers: ['user_wangwu'], status: 'published'
      },
      // 6. 糖醋排骨 — 酸甜适口
      {
        name: '糖醋排骨', emoji: '🍖',
        authorId: 'user_zhangsan', authorName: '张三',
        createTime: '2026/5/10', uploadTime: current - 18 * day,
        totalPrice: '52.00',
        dishImages: [],
        ingredientItems: [
          { name: '肋排', qty: '500', unit: '克(g)', price: '35.00', image: '' },
          { name: '白砂糖', qty: '3', unit: '勺', price: '2.00', image: '' },
          { name: '陈醋', qty: '3', unit: '勺', price: '2.00', image: '' },
          { name: '生抽', qty: '2', unit: '勺', price: '2.00', image: '' },
          { name: '料酒', qty: '2', unit: '勺', price: '2.00', image: '' },
          { name: '姜片', qty: '3', unit: '片', price: '0.50', image: '' },
          { name: '白芝麻', qty: '1', unit: '勺', price: '1.50', image: '' },
          { name: '食用油', qty: '2', unit: '勺', price: '0.50', image: '' }
        ],
        steps: [
          { content: '肋排剁小块，冷水下锅焯水，撇浮沫后捞出', image: '' },
          { content: '锅中少许油，放排骨煎至两面微黄', image: '' },
          { content: '加姜片、料酒、生抽翻炒', image: '' },
          { content: '加热水没过排骨，大火烧开转小火炖30分钟', image: '' },
          { content: '加糖和醋，大火收汁至浓稠挂满排骨', image: '' },
          { content: '撒白芝麻出锅', image: '' }
        ],
        likes: 145, likedUsers: ['user_lisi', 'user_wangwu', 'user_qianqi'], status: 'published'
      },
      // 7. 蛋炒饭 — 简单快手（归属 test_user）
      {
        name: '蛋炒饭', emoji: '🍚',
        authorId: 'test_user', authorName: '我',
        createTime: '2026/5/12', uploadTime: current - 15 * day,
        totalPrice: '5.50',
        dishImages: [],
        ingredientItems: [
          { name: '隔夜米饭', qty: '1', unit: '碗', price: '2.00', image: '' },
          { name: '鸡蛋', qty: '2', unit: '颗', price: '2.00', image: '' },
          { name: '葱花', qty: '1', unit: '把', price: '0.50', image: '' },
          { name: '盐', qty: '1', unit: '少许', price: '0.20', image: '' },
          { name: '食用油', qty: '2', unit: '勺', price: '0.50', image: '' },
          { name: '酱油', qty: '1', unit: '少许', price: '0.30', image: '' }
        ],
        steps: [
          { content: '鸡蛋打散，隔夜米饭用手抓散', image: '' },
          { content: '锅烧热倒油，油热倒入蛋液快速炒碎', image: '' },
          { content: '蛋液半凝固时倒入米饭，大火不停翻炒', image: '' },
          { content: '加盐、少许酱油调色调味', image: '' },
          { content: '撒葱花翻炒均匀出锅', image: '' }
        ],
        likes: 234, likedUsers: ['user_zhangsan', 'user_wangwu'], status: 'published'
      },
      // 8. 清蒸鲈鱼 — 高端但不贵
      {
        name: '清蒸鲈鱼', emoji: '🐟',
        authorId: 'user_wangwu', authorName: '王五',
        createTime: '2026/5/14', uploadTime: current - 12 * day,
        totalPrice: '38.50',
        dishImages: [],
        ingredientItems: [
          { name: '鲈鱼', qty: '1', unit: '条', price: '28.00', image: '' },
          { name: '葱丝', qty: '2', unit: '根', price: '1.00', image: '' },
          { name: '姜丝', qty: '1', unit: '把', price: '0.50', image: '' },
          { name: '红椒丝', qty: '1', unit: '根', price: '0.50', image: '' },
          { name: '蒸鱼豉油', qty: '2', unit: '勺', price: '3.00', image: '' },
          { name: '料酒', qty: '1', unit: '勺', price: '1.00', image: '' },
          { name: '食用油', qty: '1', unit: '勺', price: '0.50', image: '' },
          { name: '盐', qty: '1', unit: '少许', price: '0.20', image: '' }
        ],
        steps: [
          { content: '鲈鱼处理干净，两面划几刀，抹料酒和少许盐腌10分钟', image: '' },
          { content: '鱼肚塞姜丝，鱼身铺葱丝，水开后上锅大火蒸8分钟', image: '' },
          { content: '取出倒掉蒸出的汤汁，去掉旧葱姜', image: '' },
          { content: '重新铺葱丝、姜丝、红椒丝，淋蒸鱼豉油', image: '' },
          { content: '烧一勺热油浇在鱼身上，滋啦作响即成', image: '' }
        ],
        likes: 167, likedUsers: ['user_zhangsan', 'user_lisi', 'user_zhaoliu', 'test_user'], status: 'published'
      },
      // 9. 酸辣土豆丝 — 最接地气
      {
        name: '酸辣土豆丝', emoji: '🥔',
        authorId: 'user_zhaoliu', authorName: '赵六',
        createTime: '2026/5/16', uploadTime: current - 8 * day,
        totalPrice: '6.80',
        dishImages: [],
        ingredientItems: [
          { name: '土豆', qty: '2', unit: '个', price: '3.00', image: '' },
          { name: '干辣椒', qty: '5', unit: '根', price: '0.50', image: '' },
          { name: '花椒', qty: '1', unit: '少许', price: '0.30', image: '' },
          { name: '白醋', qty: '2', unit: '勺', price: '0.80', image: '' },
          { name: '蒜末', qty: '3', unit: '颗', price: '0.60', image: '' },
          { name: '盐', qty: '1', unit: '少许', price: '0.20', image: '' },
          { name: '食用油', qty: '2', unit: '勺', price: '0.80', image: '' },
          { name: '葱花', qty: '1', unit: '把', price: '0.40', image: '' },
          { name: '青椒丝', qty: '1', unit: '根', price: '0.20', image: '' }
        ],
        steps: [
          { content: '土豆去皮切细丝，泡清水10分钟去淀粉，沥干', image: '' },
          { content: '锅中油热，放花椒、干辣椒爆香后捞出', image: '' },
          { content: '大火放土豆丝快炒1分钟，加青椒丝', image: '' },
          { content: '沿锅边淋白醋，加盐翻炒均匀', image: '' },
          { content: '撒蒜末、葱花，快速翻匀出锅', image: '' }
        ],
        likes: 142, likedUsers: ['user_zhangsan', 'user_qianqi'], status: 'published'
      },
      // 10. 可乐鸡翅 — 新手友好（归属 test_user）
      {
        name: '可乐鸡翅', emoji: '🍗',
        authorId: 'test_user', authorName: '我',
        createTime: '2026/5/18', uploadTime: current - 5 * day,
        totalPrice: '22.50',
        dishImages: [],
        ingredientItems: [
          { name: '鸡翅中', qty: '8', unit: '个', price: '15.00', image: '' },
          { name: '可乐', qty: '1', unit: '碗', price: '3.00', image: '' },
          { name: '生抽', qty: '2', unit: '勺', price: '2.00', image: '' },
          { name: '老抽', qty: '1', unit: '勺', price: '1.00', image: '' },
          { name: '姜片', qty: '3', unit: '片', price: '0.50', image: '' },
          { name: '料酒', qty: '1', unit: '勺', price: '0.50', image: '' },
          { name: '白芝麻', qty: '1', unit: '少许', price: '0.50', image: '' }
        ],
        steps: [
          { content: '鸡翅两面各划两刀，冷水下锅焯水捞出', image: '' },
          { content: '锅中少许油，放鸡翅煎至两面金黄', image: '' },
          { content: '加姜片、料酒、生抽、老抽翻炒上色', image: '' },
          { content: '倒入可乐没过鸡翅，大火烧开转小火炖15分钟', image: '' },
          { content: '大火收汁至浓稠，撒白芝麻出锅', image: '' }
        ],
        likes: 89, likedUsers: ['user_lisi'], status: 'published'
      }
    ];

    // 模拟用户数据
    var userDocs = [
      {
        _id: 'user_zhangsan', nickName: '张大厨', role: 'admin',
        myRecipes: [],
        history: [], favorites: [], notifications: [],
        badges: { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 },
        likedRecipes: []
      },
      {
        _id: 'user_lisi', nickName: '李小厨', role: 'user',
        myRecipes: [],
        history: [], favorites: [], notifications: [],
        badges: { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 },
        likedRecipes: []
      },
      {
        _id: 'user_wangwu', nickName: '王美食家', role: 'user',
        myRecipes: [],
        history: [], favorites: [], notifications: [],
        badges: { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 },
        likedRecipes: []
      },
      {
        _id: 'user_zhaoliu', nickName: '赵小灶', role: 'user',
        myRecipes: [],
        history: [], favorites: [], notifications: [],
        badges: { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 },
        likedRecipes: []
      },
      {
        _id: 'user_qianqi', nickName: '钱大胃', role: 'user',
        myRecipes: [],
        history: [], favorites: [], notifications: [],
        badges: { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 },
        likedRecipes: []
      }
    ];

    // 先插入菜谱
    var chain = Promise.resolve();
    var recipeIds = [];
    for (var i = 0; i < mockRecipes.length; i++) {
      (function (recipe, idx) {
        chain = chain.then(function () {
          return s.add(s.COLLECTIONS.RECIPES, recipe);
        }).then(function (id) {
          recipeIds[idx] = id;
        });
      })(mockRecipes[i], i);
    }

    // 再插入用户
    for (var j = 0; j < userDocs.length; j++) {
      (function (ud) {
        chain = chain.then(function () {
          return s.add(s.COLLECTIONS.USERS, ud);
        });
      })(userDocs[j]);
    }

    return chain.then(function () { return true; });
  });
}

function deleteRecipe(recipeId) {
  var s = _getStorage();
  return getRecipeById(recipeId).then(function (recipe) {
    if (!recipe) return false;
    return s.remove(s.COLLECTIONS.RECIPES, recipeId).then(function () {
      return s.getById(s.COLLECTIONS.USERS, recipe.authorId).then(function (userDoc) {
        if (userDoc && userDoc.myRecipes) {
          var myRecipes = userDoc.myRecipes.filter(function (id) { return id !== recipeId; });
          return s.update(s.COLLECTIONS.USERS, recipe.authorId, { myRecipes: myRecipes });
        }
      }).catch(function () { /* ignore */ });
    }).then(function () {
      return true;
    });
  });
}

module.exports = {
  getAll: getAllRecipes,
  getById: getRecipeById,
  save: saveRecipe,
  update: updateRecipe,
  delete: deleteRecipe,
  toggleLike: toggleLike,
  isLiked: isRecipeLiked,
  getMyRecipes: getMyRecipes,
  getFavorites: getFavorites,
  initMockData: initMockData
};
