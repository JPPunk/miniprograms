const dataHelper = require('../../utils/dataHelper.js');
const rankingService = require('../../services/rankingService.js');

const PREVIEW_COUNT = 3;
const RANKING_META = {
  likes: (item) => [`❤️ ${item.likes || 0}`, `💰 ¥${item.totalPrice}`],
  price: (item) => [`💰 ¥${item.totalPrice}`, `❤️ ${item.likes || 0}`],
  value: (item) => [`❤️ ${item.likes || 0}`, `💰 ¥${item.totalPrice}`, `性价比: ${item.valueScore ? item.valueScore.toFixed(1) : '0.0'}`],
  time: (item) => [`${item.createTime}`, `❤️ ${item.likes || 0}`]
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
    rankingSections: {
      likes: { key: 'likes', title: '点赞总榜', hint: '按历史点赞排名', icon: '❤️', list: [], expanded: false },
      price: { key: 'price', title: '省钱总榜', hint: '按价格从低到高', icon: '💰', list: [], expanded: false },
      value: { key: 'value', title: '近期性价比热榜', hint: '近一月点赞÷价格', icon: '🔥', list: [], expanded: false },
      time: { key: 'time', title: '最新上传', hint: '按上传时间排序', icon: '🕐', list: [], expanded: false }
    },
    previewCount: PREVIEW_COUNT,
    loading: false
  },

  onLoad() {
    this.loadCurrentRanking();
  },

  onShow() {
    this.loadCurrentRanking();
  },

  loadCurrentRanking() {
    const { currentTab } = this.data;
    this.setData({ loading: true });

    // 按需加载当前 tab，避免一次性加载全部榜单
    const loaders = {
      likes: rankingService.byLikes,
      price: rankingService.byPrice,
      value: rankingService.byValue,
      time: rankingService.byTime
    };

    const list = loaders[currentTab](100);
    this.setData({
      [`rankingSections.${currentTab}.list`]: list,
      loading: false
    });
  },

  loadAllRankings() {
    // 保留兼容方法：供需要时全量加载
    this.setData({
      'rankingSections.likes.list': rankingService.byLikes(100),
      'rankingSections.price.list': rankingService.byPrice(100),
      'rankingSections.value.list': rankingService.byValue(100),
      'rankingSections.time.list': rankingService.byTime(100)
    });
  },

  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab }, () => {
      // 如果该 tab 未加载过数据，再加载
      const section = this.data.rankingSections[tab];
      if (!section.list || section.list.length === 0) {
        this.loadCurrentRanking();
      }
    });
  },

  toggleExpand(e) {
    const key = e.currentTarget.dataset.key;
    const expanded = !this.data.rankingSections[key].expanded;
    this.setData({
      [`rankingSections.${key}.expanded`]: expanded
    });
  },

  getDisplayList(list, expanded) {
    return expanded ? list : list.slice(0, PREVIEW_COUNT);
  },

  getMetaList(item, tabKey) {
    const mapper = RANKING_META[tabKey];
    return mapper ? mapper(item) : [];
  },

  goToDetail(e) {
    const id = e.detail.id;
    dataHelper.addToHistory(id);
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + id
    });
  }
});
