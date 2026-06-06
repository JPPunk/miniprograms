const { STORAGE_KEY, get, set } = require('./storage');
const { generateId } = require('../utils/common');

function getAll() {
  return get(STORAGE_KEY.NOTIFICATIONS, []);
}

function addNotification({ type, recipeId, recipeName, message }) {
  const notifications = getAll();
  notifications.unshift({
    id: generateId(),
    type: type || 'system',
    recipeId,
    recipeName,
    message,
    time: new Date().toLocaleString('zh-CN'),
    read: false
  });
  set(STORAGE_KEY.NOTIFICATIONS, notifications);
  return notifications[0];
}

function markRead(id) {
  const notifications = getAll();
  const item = notifications.find(n => n.id === id);
  if (item) {
    item.read = true;
    set(STORAGE_KEY.NOTIFICATIONS, notifications);
  }
  return item || null;
}

function getUnreadCount() {
  return getAll().filter(n => !n.read).length;
}

module.exports = {
  getAll,
  addNotification,
  markRead,
  getUnreadCount
};
