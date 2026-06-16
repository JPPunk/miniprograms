Component({
  properties: {
    show: { type: Boolean, value: false },
    badgeEmoji: { type: String, value: '' },
    badgeName: { type: String, value: '' },
    badgeDesc: { type: String, value: '' }
  },

  methods: {
    onClose: function () {
      this.triggerEvent('close');
    },
    preventBubble: function () {
      // 阻止冒泡，防止关闭弹窗
    }
  }
});
