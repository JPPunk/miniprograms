#!/usr/bin/env node
/**
 * 小程序预览脚本
 * 生成预览二维码，手机微信扫码即可预览
 *
 * 用法:
 *   npm run preview
 *   npm run preview -- --desc "测试新功能"
 */

const ci = require('miniprogram-ci');
const path = require('path');
const fs = require('fs');

// 解析命令行参数
const args = process.argv.slice(2);
const descArg = args.find(a => a.startsWith('--desc='));
const desc = descArg ? descArg.split('=')[1] : '预览 ' + new Date().toLocaleString('zh-CN');

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

    console.log('🚀 正在编译并生成预览二维码...\n');

    const previewResult = await ci.preview({
      project,
      desc,
      setting: {
        es6: true,
        enhance: true,
        postcss: true,
        minified: true,
      },
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
      console.error('\n提示：请确认 private/ 目录下的密钥文件是否正确');
    }
    if (err.message.includes('login')) {
      console.error('\n提示：可能需要先运行 `npm run login` 刷新登录态');
    }
    process.exit(1);
  }
})();
