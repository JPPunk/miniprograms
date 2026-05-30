#!/usr/bin/env node
/**
 * 小程序登录脚本
 * 获取并保存登录二维码，扫码授权后可用于后续操作
 *
 * 用法:
 *   npm run login
 */

const ci = require('miniprogram-ci');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PRIVATE_KEY_PATH = path.join(PROJECT_ROOT, 'private', 'private.wxc29e2adc86e681d6.key');

(async () => {
  try {
    console.log('🚀 正在获取登录二维码...\n');

    const loginResult = await ci.login({
      privateKeyPath: PRIVATE_KEY_PATH,
      qrcodeFormat: 'terminal',
      qrcodeOutputDest: '',
    });

    console.log('\n✅ 登录成功！');
    console.log('   登录态已保存，可以执行 preview 或 upload 了');
  } catch (err) {
    console.error('\n❌ 登录失败:', err.message);
    if (err.message.includes('private')) {
      console.error('\n提示：请确认 private/ 目录下的密钥文件是否存在');
    }
    process.exit(1);
  }
})();
