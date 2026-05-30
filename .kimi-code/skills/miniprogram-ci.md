# Skill: 小程序 CI 自动化

## 概述

本项目使用 `miniprogram-ci` 进行小程序的预览、上传和登录操作。所有 CI 脚本位于 `scripts/` 目录下。

## 前置条件

- 已安装依赖：`npm install`
- 私钥文件：`private/private.wxc29e2adc86e681d6.key`
  - 从微信公众平台下载：https://mp.weixin.qq.com
  - 路径：开发 -> 开发管理 -> 开发设置 -> 小程序代码上传 -> 生成密钥

## 可用命令

### 1. 预览（生成二维码）

```bash
npm run preview
npm run preview -- --desc="测试新功能"
```

生成预览二维码，微信扫码即可在手机上预览最新代码。

### 2. 上传（提交到微信公众平台）

```bash
npm run upload
npm run upload -- --version=1.0.2 --desc="修复已知问题"
```

- 不指定版本号时，自动生成格式：`YYMMDD.HHMM`
- 上传后需登录微信公众平台设置体验版或提交审核

### 3. 登录（刷新登录态）

```bash
npm run login
```

当 preview/upload 提示登录失效时执行。

## 配置文件

```javascript
// scripts/*.js 中的通用配置
const config = {
  appid: 'wxc29e2adc86e681d6',
  type: 'miniProgram',
  projectPath: './miniprogram',
  privateKeyPath: './private/private.wxc29e2adc86e681d6.key',
  ignores: ['node_modules/**/*', 'scripts/**/*', 'private/**/*', '*.md'],
  setting: {
    es6: true,
    enhance: true,
    postcss: true,
    minified: true,
  },
};
```

## CI 集成建议

在 GitHub Actions / Gitee CI 中使用：

```yaml
- name: Upload MiniProgram
  run: |
    npm ci
    npm run upload -- --version=${{ github.ref_name }} --desc="CI自动上传"
```

注意：CI 环境需要将私钥保存到 secrets 中，运行时写入文件。
