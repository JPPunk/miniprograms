const { getAll } = require('./recipeService');

const DEFAULT_LIMIT = 100;
const PREVIEW_LIMIT = 3;

function byLikes(limit = DEFAULT_LIMIT) {
  return getAll().sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, limit);
}

function byPrice(limit = DEFAULT_LIMIT) {
  return getAll()
    .sort((a, b) => parseFloat(a.totalPrice || 0) - parseFloat(b.totalPrice || 0))
    .slice(0, limit);
}

function byValue(limit = DEFAULT_LIMIT) {
  const now = Date.now();
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  return getAll()
    .filter(r => {
      const uploadTime = r.uploadTime || 0;
      return uploadTime >= oneMonthAgo;
    })
    .map(r => {
      const price = parseFloat(r.totalPrice) || 1;
      return {
        ...r,
        valueScore: (r.likes || 0) / price
      };
    })
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, limit);
}

function byTime(limit = DEFAULT_LIMIT) {
  return getAll()
    .sort((a, b) => (b.uploadTime || 0) - (a.uploadTime || 0))
    .slice(0, limit);
}

function getDisplayList(list, expanded, limit = PREVIEW_LIMIT) {
  return expanded ? list : list.slice(0, limit);
}

module.exports = {
  byLikes,
  byPrice,
  byValue,
  byTime,
  getDisplayList
};
