/**
 * Services 统一导出（微信运行时兼容：module.exports 整体赋值）
 */

module.exports = {
  storage: require('./storage'),
  recipe: require('./recipeService'),
  ranking: require('./rankingService'),
  notification: require('./notificationService'),
  history: require('./historyService'),
  user: require('./userService')
};
