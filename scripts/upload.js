#!/usr/bin/env node
/**
 * 小程序上传脚本
 * 上传代码到微信公众平台
 *
 * 用法:
 *   npm run upload
 *   npm run upload -- --version=1.0.2 --desc="修复已知问题"
 *   npm run upload -- --appid=xxx --privateKeyPath=/path/to/key
 */

const ci = require('miniprogram-ci');
const { buildConfig, validateConfig } = require('./lib/cli');

// 自动生成版本号: 年月日.时分
const now = new Date();
const defaultVersion = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

const config = validateConfig(
  buildConfig({
    version: defaultVersion,
    desc: '上传于 ' + now.toLocaleString('zh-CN')
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

    console.log(`\n🚀 正在上传...`);
    console.log(`   版本号: ${config.version}`);
    console.log(`   描述: ${config.desc}\n`);

    await ci.upload({
      project,
      version: config.version,
      desc: config.desc,
      setting: config.setting,
      onProgressUpdate: (info) => {
        if (info._msg) {
          console.log(`  ${info._msg}`);
        }
      },
    });

    console.log('\n✅ 上传成功！');
    console.log('   请登录微信公众平台设置体验版或提交审核');
    console.log('   https://mp.weixin.qq.com');
  } catch (err) {
    console.error('\n❌ 上传失败:', err.message);
    if (err.message.includes('private')) {
      console.error('\n提示：请确认私钥文件是否正确');
    }
    process.exit(1);
  }
})();
