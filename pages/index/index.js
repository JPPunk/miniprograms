var dataHelper = require('../../utils/dataHelper.js');

var PREVIEW_COUNT = 10;
var RANKING_META = {
  likes: function (item) { return ['❤️ ' + (item.likes || 0), '💰 ¥' + item.totalPrice]; },
  price: function (item) { return ['💰 ¥' + item.totalPrice, '❤️ ' + (item.likes || 0)]; },
  value: function (item) { return ['❤️ ' + (item.likes || 0), '💰 ¥' + item.totalPrice, '性价比: ' + (item.valueScore ? item.valueScore.toFixed(1) : '0.0')]; },
  time: function (item) { return [item.createTime, '❤️ ' + (item.likes || 0)]; }
};

Page({
  data: {
    currentTab: 'likes',
    tabs: [
      { key: 'likes', name: '点赞榜', icon: '❤️' },
      { key: 'price', name: '省钱榜', icon: '💰' },
      { key: 'value', name: '性价比', icon: '🔥' },
      { key: 'time', name: '最新', icon: '🕐' }
    ],
    sections: [],
    previewCount: PREVIEW_COUNT,
    loading: false
  },

  onLoad: function () {
    this.loadAllRankings();
  },

  onShow: function () {
    this.loadAllRankings();
  },

  _buildSections: function (likesList, priceList, valueList, timeList) {
    var raw = {
      likes: { key: 'likes', title: '点赞总榜', hint: '按历史点赞排名', icon: '❤️', list: likesList || [] },
      price: { key: 'price', title: '省钱总榜', hint: '按价格从低到高', icon: '💰', list: priceList || [] },
      value: { key: 'value', title: '近期性价比热榜', hint: '近一月点赞÷价格', icon: '🔥', list: valueList || [] },
      time: { key: 'time', title: '最新上传', hint: '按上传时间排序', icon: '🕐', list: timeList || [] }
    };

    var currentTab = this.data.currentTab;
    var sections = [];
    var keys = ['likes', 'price', 'value', 'time'];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var section = raw[k];
      // 为每个 section 预计算 displayList 和 metaList
      var list = section.list;
      var displayList = list.slice(0, PREVIEW_COUNT);
      var metaList = [];
      for (var j = 0; j < list.length; j++) {
        var mapper = RANKING_META[k];
        metaList.push(mapper ? mapper(list[j]) : []);
      }
      sections.push({
        key: section.key,
        title: section.title,
        hint: section.hint,
        icon: section.icon,
        list: list,
        displayList: displayList,
        metaList: metaList,
        expanded: false,
        show: (k === currentTab)
      });
    }
    return sections;
  },

  loadAllRankings: function () {
    var that = this;
    that.setData({ loading: true });

    Promise.all([
      dataHelper.getRankingByLikes(),
      dataHelper.getRankingByPrice(),
      dataHelper.getRankingByValue(),
      dataHelper.getRankingByTime()
    ]).then(function (results) {
      var sections = that._buildSections(results[0], results[1], results[2], results[3]);
      that.setData({ sections: sections, loading: false });
    }).catch(function (err) {
      console.error('加载排行榜失败:', err);
      that.setData({ loading: false });
    });
  },

  onTabChange: function (e) {
    var tab = e.currentTarget.dataset.tab;
    var sections = this.data.sections;
    for (var i = 0; i < sections.length; i++) {
      sections[i].show = (sections[i].key === tab);
    }
    this.setData({ currentTab: tab, sections: sections });
  },

  toggleExpand: function (e) {
    var key = e.currentTarget.dataset.key;
    var sections = this.data.sections;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].key === key) {
        sections[i].expanded = !sections[i].expanded;
        // 切换时更新 displayList
        if (sections[i].expanded) {
          sections[i].displayList = sections[i].list;
        } else {
          sections[i].displayList = sections[i].list.slice(0, PREVIEW_COUNT);
        }
        break;
      }
    }
    this.setData({ sections: sections });
  },

  goToDetail: function (e) {
    var id = e.detail.id;
    if (!id) return;
    dataHelper.addToHistory(id).then(function () {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
    }).catch(function () {
      wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
    });
  }
});
