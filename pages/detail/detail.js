var dataHelper = require('../../utils/dataHelper.js');
var badgeService = require('../../services/badgeService.js');

Page({
  data: {
    recipe: null,
    loading: false,
    hasLiked: false,
    recipeId: '',
    isOwner: false,
    isAdmin: false,
    badgeShow: false,
    badgeEmoji: '',
    badgeName: '',
    badgeDesc: ''
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({ recipeId: options.id });
      this.loadRecipe(options.id);
    }
  },

  onShow: function() {
    if (this.data.recipeId) {
      this.loadRecipe(this.data.recipeId);
    }
  },

  loadRecipe: function(id) {
    var that = this;
    this.setData({ loading: true });

    Promise.all([
      dataHelper.getRecipeById(id),
      dataHelper.isRecipeLiked(id),
      dataHelper.getUserId(),
      dataHelper.isAdmin()
    ]).then(function (results) {
      var recipe = results[0];
      var hasLiked = results[1];
      var currentUserId = results[2];
      var isAdmin = results[3];
      var isOwner = recipe && recipe.authorId === currentUserId;

      that.setData({
        recipe: recipe,
        hasLiked: hasLiked,
        isOwner: isOwner,
        isAdmin: isAdmin,
        loading: false
      });
    }).catch(function (err) {
      console.error('加载菜谱失败:', err);
      that.setData({ loading: false });
    });
  },

  toggleLike: function() {
    var that = this;
    var recipeId = this.data.recipeId;
    dataHelper.likeRecipe(recipeId).then(function (updatedRecipe) {
      if (updatedRecipe) {
        // 检查点赞徽章
        var userId = dataHelper.getUserId ? dataHelper.getUserId() : 'test_user';
        badgeService.checkLikeBadge(userId).then(function (badgeResult) {
          if (badgeResult && badgeResult.upgraded && badgeResult.badge) {
            that.setData({
              badgeShow: true,
              badgeEmoji: badgeResult.badge.emoji,
              badgeName: badgeResult.badge.name,
              badgeDesc: badgeResult.badge.desc
            });
          }
        }).catch(function () {});

        return that.loadRecipe(recipeId);
      }
    }).catch(function (err) {
      console.error('点赞失败:', err);
    });
  },

  onBadgeClose: function () {
    this.setData({ badgeShow: false });
  },

  goToEdit: function() {
    var recipeId = this.data.recipeId;
    wx.navigateTo({
      url: '/pages/upload/upload?id=' + recipeId
    });
  },

  onDelete: function() {
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个菜谱吗？',
      confirmColor: '#e64340',
      success: function (res) {
        if (res.confirm) {
          dataHelper.deleteRecipe(that.data.recipeId).then(function () {
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(function () {
              wx.navigateBack();
            }, 1500);
          }).catch(function (err) {
            console.error('删除失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }
    });
  }
});
