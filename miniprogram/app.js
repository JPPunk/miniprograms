var dataHelper = require('utils/dataHelper.js');

App({
  onLaunch: function () {
    dataHelper.initMockData();
  }
});