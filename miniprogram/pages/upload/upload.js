var dataHelper = require('../../utils/dataHelper.js');

Page({
  data: {
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

  onNameInput: function(e) {
    this.setData({ name: e.detail.value });
  },

  addIngredient: function() {
    const ingredients = [...this.data.ingredients];
    ingredients.push({ name: '', qty: '', unit: '', unitIndex: 0, price: '', image: '' });
    this.setData({ ingredients });
  },

  removeIngredient: function(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.ingredients.length <= 1) return;
    const ingredients = [...this.data.ingredients];
    ingredients.splice(index, 1);
    this.setData({ ingredients });
    this.calculateTotalPrice();
  },

  onIngredientName: function(e) {
    const index = e.currentTarget.dataset.index;
    const ingredients = [...this.data.ingredients];
    ingredients[index].name = e.detail.value;
    this.setData({ ingredients });
  },

  onIngredientQty: function(e) {
    const index = e.currentTarget.dataset.index;
    const ingredients = [...this.data.ingredients];
    ingredients[index].qty = e.detail.value;
    this.setData({ ingredients });
  },

  onUnitChange: function(e) {
    const index = e.currentTarget.dataset.index;
    const ingredients = [...this.data.ingredients];
    const unitIndex = e.detail.value;
    ingredients[index].unit = this.data.units[unitIndex].name;
    ingredients[index].unitIndex = unitIndex;
    this.setData({ ingredients });
  },

  onIngredientPrice: function(e) {
    const index = e.currentTarget.dataset.index;
    const ingredients = [...this.data.ingredients];
    ingredients[index].price = e.detail.value;
    this.setData({ ingredients });
    this.calculateTotalPrice();
  },

  chooseIngredientImage: function(e) {
    const index = e.currentTarget.dataset.index;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const ingredients = [...this.data.ingredients];
        ingredients[index].image = res.tempFilePaths[0];
        this.setData({ ingredients });
      }
    });
  },

  calculateTotalPrice: function() {
    let total = 0;
    this.data.ingredients.forEach(item => {
      const price = parseFloat(item.price) || 0;
      total += price;
    });
    this.setData({ totalPrice: total.toFixed(2) });
  },

  addStep: function() {
    const steps = [...this.data.steps];
    steps.push({ content: '', image: '' });
    this.setData({ steps });
  },

  removeStep: function(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.steps.length <= 1) return;
    const steps = [...this.data.steps];
    steps.splice(index, 1);
    this.setData({ steps });
  },

  onStepContent: function(e) {
    const index = e.currentTarget.dataset.index;
    const steps = [...this.data.steps];
    steps[index].content = e.detail.value;
    this.setData({ steps });
  },

  chooseStepImage: function(e) {
    const index = e.currentTarget.dataset.index;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const steps = [...this.data.steps];
        steps[index].image = res.tempFilePaths[0];
        this.setData({ steps });
      }
    });
  },

  chooseDishImage: function() {
    wx.chooseImage({
      count: 3 - this.data.dishImages.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        this.setData({
          dishImages: [...this.data.dishImages, ...res.tempFilePaths]
        });
      }
    });
  },

  removeDishImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.dishImages];
    images.splice(index, 1);
    this.setData({ dishImages: images });
  },

  submitRecipe: function() {
    const { name, ingredients, steps, dishImages } = this.data;

    if (!name.trim()) {
      wx.showToast({ title: '请输入菜谱名称', icon: 'none' });
      return;
    }

    const validIngredients = ingredients.filter(item => item.name.trim() && item.price);
    if (validIngredients.length === 0) {
      wx.showToast({ title: '请至少填写一个完整食材', icon: 'none' });
      return;
    }

    const validSteps = steps.filter(step => step.content.trim());
    if (validSteps.length === 0) {
      wx.showToast({ title: '请至少填写一个步骤', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    const recipe = {
      name: name.trim(),
      emoji: this.getEmoji(name),
      dishImages: dishImages,
      ingredientItems: ingredients.filter(item => item.name.trim()),
      steps: steps.filter(step => step.content.trim()),
      totalPrice: this.data.totalPrice
    };

    dataHelper.saveRecipe(recipe);

    setTimeout(() => {
      wx.showToast({ title: '上传成功！', icon: 'success' });
      this.resetForm();
      this.setData({ submitting: false });
    }, 1000);
  },

  getEmoji: function(name) {
    const emojis = ['🥩', '🍳', '🍗', '🍖', '🧈', '🥘', '🍲', '🥗', '🍜', '🍝', '🥟', '🍕'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return emojis[Math.abs(hash) % emojis.length];
  },

  resetForm: function() {
    this.setData({
      name: '',
      ingredients: [{ name: '', qty: '', unit: '', unitIndex: 0, price: '', image: '' }],
      totalPrice: '0.00',
      steps: [{ content: '', image: '' }],
      dishImages: []
    });
  }
});