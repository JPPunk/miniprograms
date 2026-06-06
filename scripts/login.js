#!/usr/bin/env node
/**
 * 小程序登录脚本
 * 获取并保存登录二维码，扫码授权后可用于后续操作
 *
 * 用法:
 *   npm run login
 *   npm run login -- --privateKeyPath=/path/to/key
 */

const ci = require('miniprogram-ci');
const { buildConfig, validateConfig } = require('./lib/cli');

const config = validateConfig(buildConfig());

(async () => {
  try {
    console.log('🚀 正在获取登录二维码...\n');

    await ci.login({
      privateKeyPath: config.privateKeyPath,
      qrcodeFormat: 'terminal',
      qrcodeOutputDest: '',
    });

    console.log('\n✅ 登录成功！');
    console.log('   登录态已保存，可以执行 preview 或 upload 了');
  } catch (err) {
    console.error('\n❌ 登录失败:', err.message);
    if (err.message.includes('private')) {
      console.error('\n提示：请确认私钥文件是否存在');
    }
    process.exit(1);
  }
})();
