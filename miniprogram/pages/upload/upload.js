var dataHelper = require('../../utils/dataHelper.js');

Page({
  data: {
    editId: '',
    editMode: false,
    name: '',
    ingredients: [
      { name: '', qty: '', unit: '', unitIndex: 0, price: '', image: '' }
    ],
    totalPrice: '0.00',
    steps: [
      { content: '', image: '' }
    ],
    dishImages: [],
    submitting: false,
    badgeShow: false,
    badgeEmoji: '',
    badgeName: '',
    badgeDesc: '',
    units: [
      { name: '克(g)', value: 'g' },
      { name: '千克(kg)', value: 'kg' },
      { name: '毫升(ml)', value: 'ml' },
      { name: '升(L)', value: 'L' },
      { name: '个', value: '个' },
      { name: '颗', value: '颗' },
      { name: '根', value: '根' },
      { name: '条', value: '条' },
      { name: '片', value: '片' },
      { name: '把', value: '把' },
      { name: '勺', value: '勺' },
      { name: '杯', value: '杯' },
      { name: '碗', value: '碗' },
      { name: '斤', value: '斤' },
      { name: '两', value: '两' },
      { name: '钱', value: '钱' },
      { name: '适量', value: '适量' },
      { name: '少许', value: '少许' },
      { name: '按需', value: '按需' }
    ]
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({ editId: options.id, editMode: true });
      this.loadRecipeForEdit(options.id);
    } else {
      this.resetForm();
    }
  },

  onShow: function() {
  },

  loadRecipeForEdit: function(id) {
    var that = this;
    dataHelper.getRecipeById(id).then(function (recipe) {
      if (!recipe) {
        wx.showToast({ title: '菜谱不存在', icon: 'none' });
        return;
      }

      var ingredients = (recipe.ingredientItems || []).map(function (item) {
        var unitIndex = -1;
        for (var j = 0; j < that.data.units.length; j++) {
          if (that.data.units[j].name === item.unit) {
            unitIndex = j;
            break;
          }
        }
        var newItem = {};
        for (var k in item) { newItem[k] = item[k]; }
        newItem.unitIndex = unitIndex >= 0 ? unitIndex : 0;
        return newItem;
      });

      that.setData({
        name: recipe.name,
        ingredients: ingredients.length > 0 ? ingredients : [{ name: '', qty: '', unit: '', unitIndex: 0, price: '', image: '' }],
        totalPrice: recipe.totalPrice || '0.00',
        steps: (recipe.steps && recipe.steps.length > 0) ? recipe.steps : [{ content: '', image: '' }],
        dishImages: recipe.dishImages || []
      });
    }).catch(function (err) {
      console.error('加载菜谱失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  onNameInput: function(e) {
    this.setData({ name: e.detail.value });
  },

  addIngredient: function() {
    var ingredients = this.data.ingredients.slice();
    ingredients.push({ name: '', qty: '', unit: '', unitIndex: 0, price: '', image: '' });
    this.setData({ ingredients: ingredients });
  },

  removeIngredient: function(e) {
    var index = e.currentTarget.dataset.index;
    if (this.data.ingredients.length <= 1) return;
    var ingredients = this.data.ingredients.slice();
    ingredients.splice(index, 1);
    this.setData({ ingredients: ingredients });
    this.calculateTotalPrice();
  },

  onIngredientName: function(e) {
    var index = e.currentTarget.dataset.index;
    var ingredients = this.data.ingredients.slice();
    ingredients[index].name = e.detail.value;
    this.setData({ ingredients: ingredients });
  },

  onIngredientQty: function(e) {
    var index = e.currentTarget.dataset.index;
    var ingredients = this.data.ingredients.slice();
    ingredients[index].qty = e.detail.value;
    this.setData({ ingredients: ingredients });
  },

  onUnitChange: function(e) {
    var index = e.currentTarget.dataset.index;
    var ingredients = this.data.ingredients.slice();
    var unitIndex = e.detail.value;
    ingredients[index].unit = this.data.units[unitIndex].name;
    ingredients[index].unitIndex = unitIndex;
    this.setData({ ingredients: ingredients });
  },

  onIngredientPrice: function(e) {
    var index = e.currentTarget.dataset.index;
    var ingredients = this.data.ingredients.slice();
    ingredients[index].price = e.detail.value;
    this.setData({ ingredients: ingredients });
    this.calculateTotalPrice();
  },

  chooseIngredientImage: function(e) {
    var index = e.currentTarget.dataset.index;
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        // TODO: 上传图片到云存储
        var ingredients = that.data.ingredients.slice();
        ingredients[index].image = res.tempFilePaths[0];
        that.setData({ ingredients: ingredients });
      }
    });
  },

  calculateTotalPrice: function() {
    var total = 0;
    var ingredients = this.data.ingredients;
    for (var i = 0; i < ingredients.length; i++) {
      var price = parseFloat(ingredients[i].price) || 0;
      total += price;
    }
    this.setData({ totalPrice: total.toFixed(2) });
  },

  addStep: function() {
    var steps = this.data.steps.slice();
    steps.push({ content: '', image: '' });
    this.setData({ steps: steps });
  },

  removeStep: function(e) {
    var index = e.currentTarget.dataset.index;
    if (this.data.steps.length <= 1) return;
    var steps = this.data.steps.slice();
    steps.splice(index, 1);
    this.setData({ steps: steps });
  },

  onStepContent: function(e) {
    var index = e.currentTarget.dataset.index;
    var steps = this.data.steps.slice();
    steps[index].content = e.detail.value;
    this.setData({ steps: steps });
  },

  chooseStepImage: function(e) {
    var index = e.currentTarget.dataset.index;
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        // TODO: 上传图片到云存储
        var steps = that.data.steps.slice();
        steps[index].image = res.tempFilePaths[0];
        that.setData({ steps: steps });
      }
    });
  },

  chooseDishImage: function() {
    var that = this;
    wx.chooseImage({
      count: 3 - this.data.dishImages.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        // TODO: 上传图片到云存储
        that.setData({
          dishImages: that.data.dishImages.concat(res.tempFilePaths)
        });
      }
    });
  },

  removeDishImage: function(e) {
    var index = e.currentTarget.dataset.index;
    var images = this.data.dishImages.slice();
    images.splice(index, 1);
    this.setData({ dishImages: images });
  },

  submitRecipe: function() {
    var that = this;
    var name = this.data.name;
    var ingredients = this.data.ingredients;
    var steps = this.data.steps;
    var dishImages = this.data.dishImages;
    var editMode = this.data.editMode;
    var editId = this.data.editId;

    if (!name.trim()) {
      wx.showToast({ title: '请输入菜谱名称', icon: 'none' });
      return;
    }

    var validIngredients = ingredients.filter(function (item) { return item.name.trim() && item.price; });
    if (validIngredients.length === 0) {
      wx.showToast({ title: '请至少填写一个完整食材', icon: 'none' });
      return;
    }

    var validSteps = steps.filter(function (step) { return step.content.trim(); });
    if (validSteps.length === 0) {
      wx.showToast({ title: '请至少填写一个步骤', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    var recipeData = {
      name: name.trim(),
      emoji: this.getEmoji(name),
      dishImages: dishImages,
      ingredientItems: ingredients.filter(function (item) { return item.name.trim(); }),
      steps: steps.filter(function (step) { return step.content.trim(); }),
      totalPrice: this.data.totalPrice
    };

    var savePromise;
    if (editMode) {
      savePromise = dataHelper.getRecipeById(editId).then(function (existing) {
        if (!existing) {
          wx.showToast({ title: '菜谱不存在', icon: 'none' });
          return null;
        }
        var merged = {};
        for (var k in existing) { merged[k] = existing[k]; }
        for (var k2 in recipeData) { merged[k2] = recipeData[k2]; }
        return dataHelper.updateRecipe(merged);
      });
    } else {
      savePromise = dataHelper.saveRecipe(recipeData);
    }

    savePromise.then(function (result) {
      if (result === null) return;
      
      var title = editMode ? '保存成功！' : '上传成功！';
      wx.showToast({ title: title, icon: 'success' });

      // 检查是否获得新徽章
      if (!editMode && result && result.badgeUpgraded && result.newBadge) {
        that.setData({
          badgeShow: true,
          badgeEmoji: result.newBadge.emoji,
          badgeName: result.newBadge.name,
          badgeDesc: result.newBadge.desc
        });
      }

      setTimeout(function () {
        wx.navigateBack();
      }, editMode || !(result && result.badgeUpgraded) ? 1500 : 2500);
    }).catch(function (err) {
      console.error('操作失败:', err);
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    }).then(function () {
      that.setData({ submitting: false });
    });
  },

  getEmoji: function(name) {
    var emojis = ['🍖', '🍳', '🍗', '🍖', '🧈', '🥘', '🍲', '🥗', '🍜', '🍝', '🥟', '🍕'];
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return emojis[Math.abs(hash) % emojis.length];
  },

  resetForm: function() {
    this.setData({
      editId: '',
      editMode: false,
      name: '',
      ingredients: [{ name: '', qty: '', unit: '', unitIndex: 0, price: '', image: '' }],
      totalPrice: '0.00',
      steps: [{ content: '', image: '' }],
      dishImages: []
    });
  },

  onBadgeClose: function () {
    this.setData({ badgeShow: false });
  }
});
