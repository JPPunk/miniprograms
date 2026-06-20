# 🍳 ChefRank（妙算小厨）

> 一个帮你记录菜谱成本、发现高性价比美食的微信小程序。

> **ChefRank —— 你的家常菜精打细算助手。**
> 
> 中文名「妙算小厨」寓意：巧妙计算，小厨房也能做出大美味。
>
> 🏆 四大榜单，一眼看出好菜：点赞最多、成本最低、性价比最高、最新上传，帮你快速发现值得做的菜。
>
> 📝 完整记录每道菜：食材用量、单价、烹饪步骤、成品图，自动计算总成本，做到心中有数。
>
> 💰 算清每一笔账：食材自动计价，不用掏计算器，上传菜谱时就能看到这道菜花了多少钱。
>
> 🔥 性价比排行：点赞数÷成本，找出大家公认又好吃又便宜的菜，做饭不再踩雷。
>
> 无论你是精打细算的上班族，还是想给家人做顿好饭的厨房新手，ChefRank 都能帮你吃得实惠、做得明白。

[![微信小程序](https://img.shields.io/badge/平台-微信小程序-brightgreen)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![License](https://img.shields.io/badge/许可证-MIT-blue)](LICENSE)

---

## 📱 功能介绍

### 🏆 排行榜
首页展示四大维度的菜谱榜单，助你快速发现好菜：

| 榜单 | 排序规则 |
|---|---|
| ❤️ 点赞榜 | 按点赞数从高到低 |
| 💰 省钱榜 | 按总成本从低到高 |
| 🔥 性价比榜 | 按「点赞数 / 成本」排序（近30天） |
| 🕐 最新上传 | 按上传时间从新到旧 |

- 默认展开前 3 条，点击可展开完整榜单
- 点击任意菜谱进入详情页
- 首页采用**按需懒加载**，切换 tab 时才加载对应榜单数据

### 📝 上传菜谱
支持创建完整的菜谱档案：

- **菜谱名称**：自动生成 emoji 标识
- **食材清单**：名称、数量、单位、单价、实拍图
- **烹饪步骤**：每步支持文字描述 + 实拍图
- **成品图**：最多上传 3 张
- **自动计价**：根据食材单价实时计算总成本

### 👤 我的
个人中心聚合所有与用户相关的数据：

- **数据统计**：发布菜谱数、收藏数、获赞总数
- **我的菜谱**：自己上传的所有菜谱
- **收藏夹**：点赞过的菜谱
- **浏览历史**：最近查看的 50 条菜谱
- **消息通知**：点赞提醒，支持标记已读
- **设置**：消息通知开关、关于小程序

### 📄 菜谱详情
完整的菜谱展示页：

- 菜谱名称、作者、Emoji 标识、总成本
- 食材清单（含数量、单价、小计）
- 分步骤图文教程
- 点赞 / 取消点赞

---

## 🏗️ 技术架构

### 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | 原生微信小程序 |
| 数据存储 | `wx.storage`（本地存储，services 层封装）|
| CI 工具 | `miniprogram-ci` + GitHub Actions |
| 测试 | Jest（Services 单元测试）|
| 构建 | 微信开发者工具 |

### 项目结构

```
├── miniprogram/                  # 小程序源码
│   ├── app.js                    # 全局逻辑（初始化 Mock 数据）
│   ├── app.json                  # 全局配置（页面路由、TabBar、导航栏）
│   ├── app.wxss                  # 全局样式（CSS 变量系统）
│   ├── components/               # 公共组件
│   │   ├── empty-state/          # 空状态提示
│   │   ├── loading-state/        # 加载状态
│   │   └── recipe-card/          # 菜谱卡片
│   ├── pages/                    # 页面目录
│   │   ├── index/                # 🏆 排行榜首页
│   │   ├── upload/               # 📝 上传菜谱
│   │   ├── my/                   # 👤 我的
│   │   ├── detail/               # 📄 菜谱详情
│   │   └── notifications/        # 🔔 消息通知
│   ├── services/                 # 业务服务层
│   │   ├── storage.js            # 本地存储封装
│   │   ├── recipeService.js      # 菜谱 CRUD
│   │   ├── rankingService.js     # 排行榜算法
│   │   ├── notificationService.js# 通知管理
│   │   ├── historyService.js     # 浏览历史
│   │   └── index.js              # 统一导出
│   ├── utils/
│   │   ├── dataHelper.js         # 兼容层（原数据接口，委托 services）
│   │   └── common.js             # 通用工具函数
│   ├── cloud/                    # 云开发（预留）
│   ├── icons/                    # TabBar 图标
│   └── images/                   # 静态图片资源
├── scripts/                      # CI 自动化脚本
│   ├── lib/cli.js                # 配置合并与参数解析
│   ├── preview.js                # 生成预览二维码
│   ├── upload.js                 # 上传代码到微信公众平台
│   └── login.js                  # 刷新登录态
├── config/
│   └── ci.js                     # CI 默认配置
├── __tests__/                    # Jest 测试用例
│   └── services/                 # Services 单元测试
├── private/                      # 私钥文件（不上传仓库）
├── .github/workflows/            # GitHub Actions 工作流
├── package.json                  # Node.js 依赖
└── jest.setup.js                 # Jest 全局 Mock
```

### 数据模型

```javascript
Recipe {
  _id: string,              // 唯一标识
  name: string,             // 菜谱名称
  emoji: string,            // 自动生成的 emoji
  authorName: string,       // 作者名
  createTime: string,       // 创建日期
  uploadTime: number,       // 上传时间戳（用于排序）
  totalPrice: string,       // 总成本
  dishImages: string[],     // 成品图
  ingredientItems: [{       // 食材列表
    name, qty, unit, price, image
  }],
  steps: [{                 // 步骤列表
    content, image
  }],
  likes: number,            // 点赞数
  likedUsers: string[]      // 点赞用户列表
}
```

---

## 🚀 快速开始

### 环境准备

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 注册 [微信公众平台](https://mp.weixin.qq.com) 小程序账号
3. 安装 Node.js（≥ 18）

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/JPPunk/miniprograms.git
cd miniprograms/AI_Projects/miniprogram

# 安装依赖
npm install

# 运行测试
npm test

# 使用微信开发者工具打开 miniprogram/ 目录
# 填入你的 appid（或选择测试号）
```

### 数据初始化

首次启动时，`app.js` 会自动调用 `recipeService.initMockData()` 写入 5 条示例菜谱数据（红烧肉、番茄炒蛋、宫保鸡丁、糖醋排骨、麻婆豆腐）。

---

## 🧪 测试

```bash
# 运行全部测试
npm test

# 监听模式
npm run test:watch
```

测试覆盖 `services/` 和 `utils/` 下的核心逻辑。`jest.setup.js` 提供了 `wx` 全局 Mock，无需真实小程序环境即可运行单元测试。

---

## 🚀 CI / CD

### 本地发布

#### 1. 配置上传密钥

登录微信公众平台 → 开发 → 开发管理 → 开发设置 → 小程序代码上传 → 生成密钥 → 下载 `.key` 文件 → 放入 `private/` 目录。

#### 2. 登录

```bash
npm run login
```

扫码授权后，登录态自动保存。

#### 3. 预览（生成二维码）

```bash
npm run preview
npm run preview -- --desc="测试新功能"
```

#### 4. 上传

```bash
npm run upload
npm run upload -- --version=1.0.2 --desc="修复已知问题"
```

不指定版本号时，自动生成格式：`YYMMDD.HHMM`。

### GitHub Actions 自动发布

本项目已配置 `.github/workflows/miniprogram-ci.yml`：

- **Push / PR 到 master**：自动运行测试
- **PR**：生成预览二维码并上传 Artifact
- **Push 到 master**：自动上传代码到微信公众平台

#### 配置 Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：

| Secret | 说明 |
|---|---|
| `WX_APPID` | 小程序 AppID |
| `WX_PRIVATE_KEY` | 上传密钥文件内容（完整文本） |

---

## 📋 开发规范

### 页面标准结构

```javascript
Page({
  data: { /* 页面数据 */ },

  onLoad(options) { /* 页面加载 */ },
  onShow() { /* 页面显示 */ },

  // 业务方法
  loadData() { /* 加载数据 */ },
  onTabChange(e) { /* 切换 Tab */ },
});
```

### 数据操作

所有数据操作统一通过 `services/` 下的服务模块封装，禁止页面直接读写 `wx.storage`。原 `utils/dataHelper.js` 仍保留为兼容层，内部委托给 `services/`。

### 样式规范

- 尺寸单位：`rpx`
- 使用 `app.wxss` 中定义的 CSS 变量（`--primary`, `--bg-page` 等）
- 颜色值：小写十六进制
- 避免使用 ID 选择器
- 公共样式提取到 `app.wxss`

---

## 🗺️ 路线图

- [ ] 接入云开发，实现多用户数据同步
- [ ] 支持菜谱搜索功能
- [ ] 支持评论和评分
- [ ] 分享菜谱卡片到微信好友
- [ ] 接入微信登录获取真实用户信息

---

## 📄 许可证

[MIT](LICENSE)

---

> 由 **Kimi Code** 辅助开发 ❤️
