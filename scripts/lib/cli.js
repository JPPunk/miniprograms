/**
 * CLI 参数解析与配置合并工具
 */

const fs = require('fs');
const path = require('path');
const defaultConfig = require('../../config/ci');

function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      const key = eq > -1 ? arg.slice(2, eq) : arg.slice(2);
      const value = eq > -1 ? arg.slice(eq + 1) : true;
      args[key] = value;
    }
  }
  return args;
}

function resolvePrivateKeyPath(inputPath) {
  if (!inputPath) return null;
  if (!fs.existsSync(inputPath)) return null;

  const stat = fs.statSync(inputPath);
  if (stat.isFile()) return inputPath;

  if (stat.isDirectory()) {
    const files = fs.readdirSync(inputPath).filter(
      f => f.startsWith('private.') && f.endsWith('.key')
    );
    if (files.length === 1) {
      return path.join(inputPath, files[0]);
    }
    if (files.length > 1) {
      console.warn(`⚠️  private 目录下有多个密钥文件，请指定具体文件：${files.join(', ')}`);
    }
  }
  return null;
}

function buildConfig(overrides = {}) {
  const args = parseArgs();

  const appid = args.appid || process.env.WX_APPID || defaultConfig.appid;
  let privateKeyPath = resolvePrivateKeyPath(
    args.privateKeyPath || process.env.WX_PRIVATE_KEY_PATH || defaultConfig.privateKeyPath
  );
  const version = args.version || process.env.WX_VERSION || overrides.version || defaultConfig.version;
  const desc = args.desc || process.env.WX_DESC || overrides.desc || defaultConfig.description;
  const projectPath = defaultConfig.projectPath;

  return {
    appid,
    privateKeyPath,
    version,
    desc,
    projectPath,
    setting: { ...defaultConfig.setting, ...overrides.setting }
  };
}

function validateConfig(config) {
  let valid = true;
  if (!config.appid) {
    console.error('❌ 缺少 appid，请通过 --appid=xxx 或环境变量 WX_APPID 提供');
    valid = false;
  }
  if (!config.privateKeyPath) {
    console.error('❌ 缺少私钥文件，请通过 --privateKeyPath=xxx 或环境变量 WX_PRIVATE_KEY_PATH 提供');
    valid = false;
  }
  if (!valid) {
    console.error('\n获取密钥步骤：');
    console.error('  1. 登录微信公众平台: https://mp.weixin.qq.com');
    console.error('  2. 开发 -> 开发管理 -> 开发设置 -> 小程序代码上传');
    console.error('  3. 点击「生成」密钥，下载 private.xxx.key');
    console.error('  4. 将文件放到项目根目录的 private/ 文件夹下');
    process.exit(1);
  }
  return config;
}

module.exports = { parseArgs, buildConfig, validateConfig, resolvePrivateKeyPath };
