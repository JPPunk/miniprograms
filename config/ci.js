/**
 * CI / miniprogram-ci 配置
 * 优先级：命令行参数 > 环境变量 > 本文件默认值
 */

const path = require('path');

// 小程序 AppID
const appid = process.env.WX_APPID || '';

// 密钥路径：默认指向 private/ 目录，脚本会自动解析目录中的 .key 文件
const privateKeyPath = process.env.WX_PRIVATE_KEY_PATH || path.join(__dirname, '../private');

// 版本号和描述（upload 用）
const version = process.env.WX_VERSION || require('../package.json').version;
const description = process.env.WX_DESC || `CI build ${new Date().toISOString()}`;

// 项目源码路径
const projectPath = path.join(__dirname, '../miniprogram');

module.exports = {
  appid,
  privateKeyPath,
  version,
  description,
  projectPath,
  setting: {
    es6: true,
    es7: true,
    minified: true,
    codeProtect: false,
    autoPrefixWXSS: true
  },
  compileOptions: {
    minify: true,
    minifyJS: true,
    minifyWXSS: true
  }
};
