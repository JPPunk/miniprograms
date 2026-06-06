#!/usr/bin/env node
/**
 * 小程序预览脚本
 * 生成预览二维码，手机微信扫码即可预览
 *
 * 用法:
 *   npm run preview
 *   npm run preview -- --desc="测试新功能"
 *   npm run preview -- --appid=xxx --privateKeyPath=/path/to/key
 */

const ci = require('miniprogram-ci');
const { buildConfig, validateConfig } = require('./lib/cli');

const config = validateConfig(
  buildConfig({
    desc: '预览 ' + new Date().toLocaleString('zh-CN')
  })
);

(async () => {
  try {
    const project = new ci.Project({
      appid: config.appid,
      type: 'miniProgram',
      projectPath: config.projectPath,
      privateKeyPath: config.privateKeyPath,
      ignores: ['node_modules/**/*', 'scripts/**/*', 'private/**/*', '*.md'],
    });

    console.log('🚀 正在编译并生成预览二维码...\n');

    await ci.preview({
      project,
      desc: config.desc,
      setting: config.setting,
      qrcodeFormat: 'terminal',
      qrcodeOutputDest: '',
      pagePath: 'pages/index/index',
      searchQuery: '',
      scene: 1001,
      onProgressUpdate: (info) => {
        if (info._msg) {
          console.log(`  ${info._msg}`);
        }
      },
    });

    console.log('\n✅ 预览二维码已生成，请用微信扫码');
  } catch (err) {
    console.error('\n❌ 预览失败:', err.message);
    if (err.message.includes('private')) {
      console.error('\n提示：请确认私钥文件是否正确');
    }
    if (err.message.includes('login')) {
      console.error('\n提示：可能需要先运行 `npm run login` 刷新登录态');
    }
    process.exit(1);
  }
})();
