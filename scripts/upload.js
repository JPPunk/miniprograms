#!/usr/bin/env node
/**
 * 小程序上传脚本
 * 上传代码到微信公众平台
 *
 * 用法:
 *   npm run upload
 *   npm run upload -- --version=1.0.2 --desc="修复已知问题"
 */

const ci = require('miniprogram-ci');
const path = require('path');
const fs = require('fs');

// 解析命令行参数
const args = process.argv.slice(2);
const versionArg = args.find(a => a.startsWith('--version='));
const descArg = args.find(a => a.startsWith('--desc='));

// 自动生成版本号: 年月日.时分
const now = new Date();
const defaultVersion = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

const version = versionArg ? versionArg.split('=')[1] : defaultVersion;
const desc = descArg ? descArg.split('=')[1] : '上传于 ' + now.toLocaleString('zh-CN');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PRIVATE_KEY_PATH = path.join(PROJECT_ROOT, 'private', 'private.wxc29e2adc86e681d6.key');
const PROJECT_PATH = path.join(PROJECT_ROOT, 'miniprogram');

// 检查私钥是否存在
if (!fs.existsSync(PRIVATE_KEY_PATH)) {
  console.error('\n❌ 缺少小程序上传密钥！');
  console.error('请按以下步骤获取：');
  console.error('  1. 登录微信公众平台: https://mp.weixin.qq.com');
  console.error('  2. 开发 -> 开发管理 -> 开发设置 -> 小程序代码上传');
  console.error('  3. 点击「生成」密钥，下载 private.wxc29e2adc86e681d6.key');
  console.error('  4. 将文件放到项目根目录的 private/ 文件夹下');
  console.error('\n密钥路径:', PRIVATE_KEY_PATH);
  process.exit(1);
}

(async () => {
  try {
    const project = new ci.Project({
      appid: 'wxc29e2adc86e681d6',
      type: 'miniProgram',
      projectPath: PROJECT_PATH,
      privateKeyPath: PRIVATE_KEY_PATH,
      ignores: ['node_modules/**/*', 'scripts/**/*', 'private/**/*', '*.md'],
    });

    console.log(`\n🚀 正在上传...`);
    console.log(`   版本号: ${version}`);
    console.log(`   描述: ${desc}\n`);

    const uploadResult = await ci.upload({
      project,
      version,
      desc,
      setting: {
        es6: true,
        enhance: true,
        postcss: true,
        minified: true,
      },
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
      console.error('\n提示：请确认 private/ 目录下的密钥文件是否正确');
    }
    process.exit(1);
  }
})();
