var dataHelper = require('../../utils/dataHelper.js');

Page({
  data: {
    recipe: null,
    loading: false,
    hasLiked: false,
    recipeId: ''
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
    this.setData({ loading: true });

    const recipe = dataHelper.getRecipeById(id);
    const hasLiked = dataHelper.isRecipeLiked(id, 'test_user');

    setTimeout(() => {
      this.setData({
        recipe: recipe,
        hasLiked: hasLiked,
        loading: false
      });
    }, 300);
  },

  toggleLike: function() {
    const { recipeId, hasLiked, recipe } = this.data;
    const updatedRecipe = dataHelper.likeRecipe(recipeId, 'test_user');

    if (updatedRecipe) {
      this.setData({
        hasLiked: !hasLiked,
        'recipe.likes': updatedRecipe.likes
      });
    }
  }
});