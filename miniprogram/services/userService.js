const { STORAGE_KEY, get, set } = require('./storage');

const DEFAULT_USER = {
  nickName: '美食爱好者',
  avatarUrl: ''
};

const MOCK_USER_ID = 'test_user';

function getInfo() {
  return get(STORAGE_KEY.USER_INFO, DEFAULT_USER);
}

function setInfo(info) {
  set(STORAGE_KEY.USER_INFO, { ...getInfo(), ...info });
  return getInfo();
}

function getUserId() {
  return MOCK_USER_ID;
}

module.exports = {
  getInfo,
  setInfo,
  getUserId
};
