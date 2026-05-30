var dataHelper = require('../../utils/dataHelper.js');

const PREVIEW_COUNT = 3;

Page({
  data: {
    currentTab: 'likes',
    tabs: [
      { key: 'likes', name: '❤️ 点赞榜', icon: '❤️' },
      { key: 'price', name: '💰 省钱榜', icon: '💰' },
      { key: 'value', name: '🔥 性价比', icon: '🔥' },
      { key: 'time', name: '🕐 最新上传', icon: '🕐' }
    ],
    likesList: [],
    likesExpanded: false,
    priceList: [],
    priceExpanded: false,
    valueList: [],
    valueExpanded: false,
    timeList: [],
    timeExpanded: false,
    loading: false
  },

  onLoad: function() {
    this.loadAllRankings();
  },

  onShow: function() {
    this.loadAllRankings();
  },

  loadAllRankings: function() {
    this.setData({ loading: true });

    const likesList = dataHelper.getRankingByLikes(100);
    const priceList = dataHelper.getRankingByPrice(100);
    const valueList = dataHelper.getRankingByValue(100);
    const timeList = dataHelper.getRankingByTime(100);

    this.setData({
      likesList: likesList,
      priceList: priceList,
      valueList: valueList,
      timeList: timeList,
      loading: false
    });
  },

  onTabChange: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  expandList: function(e) {
    const listKey = e.currentTarget.dataset.key;
    this.setData({
      [listKey + 'Expanded']: true
    });
  },

  collapseList: function(e) {
    const listKey = e.currentTarget.dataset.key;
    this.setData({
      [listKey + 'Expanded']: false
    });
  },

  getDisplayList: function(list, expanded) {
    return expanded ? list : list.slice(0, PREVIEW_COUNT);
  },

  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    dataHelper.addToHistory(id);
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + id
    });
  }
});