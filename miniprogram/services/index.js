/**
 * Services 统一导出
 */

module.exports = {
  storage: require('./storage'),
  recipe: require('./recipeService'),
  ranking: require('./rankingService'),
  notification: require('./notificationService'),
  history: require('./historyService'),
  user: require('./userService')
};
