Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    recipe: {
      type: Object,
      value: {}
    },
    showRank: {
      type: Boolean,
      value: false
    },
    rank: {
      type: Number,
      value: 0
    }
  },
  methods: {
    onTap() {
      const { recipe } = this.properties;
      if (recipe && recipe._id) {
        this.triggerEvent('tap', { id: recipe._id });
      }
    }
  }
});
