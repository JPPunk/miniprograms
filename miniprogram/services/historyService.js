const { STORAGE_KEY, get, set } = require('./storage');
const { getById } = require('./recipeService');

const MAX_HISTORY = 50;

function add(recipeId) {
  let history = get(STORAGE_KEY.HISTORY, []);
  history = history.filter(id => id !== recipeId);
  history.unshift(recipeId);
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  set(STORAGE_KEY.HISTORY, history);
  return history;
}

function getAll() {
  const historyIds = get(STORAGE_KEY.HISTORY, []);
  return historyIds
    .map(id => getById(id))
    .filter(Boolean);
}

function clear() {
  set(STORAGE_KEY.HISTORY, []);
}

module.exports = {
  add,
  getAll,
  clear
};
