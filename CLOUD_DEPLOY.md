# ChefRank（妙算小厨）- 云开发部署指南

## 项目信息

- **项目名称**: ChefRank（妙算小厨）
- **AppID**: `wx8a8bdd79631a02a0`
- **环境 ID**: `cloudbase-d7g0ms7t6569c7e0e`
- **仓库**: https://github.com/JPPunk/miniprograms

## 快速开始

### 1. 导入项目

1. 打开微信开发者工具
2. 选择 **"导入项目"**
3. 项目目录: `/path/to/miniprograms/AI_Projects/miniprogram`
4. AppID: `wx8a8bdd79631a02a0`
5. 后端服务: **微信云开发**

### 2. 开通云开发

1. 点击工具栏 **"云开发"** 按钮
2. 选择 **"开通"**
3. 记录环境 ID: `cloudbase-d7g0ms7t6569c7e0e`
4. 确保 `app.js` 中已配置正确环境 ID

### 3. 部署云函数

在微信开发者工具中：
1. 展开 `cloud/functions/` 目录
2. 依次右键以下文件夹，选择 **"创建并部署：云端安装依赖"**:
   - `recipes/` - 登录验证
   - `users/` - 用户管理
   - `rankings/` - 排行榜
   - `likes/` - 点赞功能
   - `recipeManage/` - 菜谱管理

### 4. 创建数据库

在云开发控制台 → 数据库：
1. 创建集合: `recipes`
2. 创建集合: `users`
3. （可选）创建集合: `notifications`
4. （可选）创建集合: `history`

### 5. 设置权限

在数据库集合权限设置中，选择 **"自定义安全规则"**，导入 `cloud/database/rules.json`。

### 6. 运行项目

点击开发者工具 **"编译"**，小程序将自动初始化并运行。

---

| 云函数 | 功能 | 文件 |
|-------|------|------|
| `recipes` | 登录验证、批量操作 | `cloud/functions/recipes/` |
| `users` | 用户管理、历史记录、通知 | `cloud/functions/users/` |
| `rankings` | 排行榜查询 | `cloud/functions/rankings/` |
| `likes` | 点赞功能 | `cloud/functions/likes/` |
| `recipeManage` | 菜谱增删改查 | `cloud/functions/recipeManage/` |

## 部署步骤

### 1. 在微信开发者工具中部署

1. 打开微信开发者工具
2. 右键 `cloud/functions/recipes` 目录
3. 选择 **"创建并部署：云端安装依赖"**
4. 重复上述步骤部署其他云函数

### 2. 创建数据库集合

在**云开发控制台** → **数据库**中创建以下集合：

1. `recipes` - 菜谱集合
2. `users` - 用户集合

### 3. 设置数据库权限

在数据库集合的权限设置中选择：**"所有用户可读，仅创建者可写"**

或者导入 `cloud/database/rules.json` 中的自定义权限规则。

### 4. 初始化数据（可选）

如果需要导入 Mock 数据，可以在小程序中执行：

```javascript
// 在控制台执行
const db = wx.cloud.database()

// 导入菜谱数据
const recipes = [...] // Mock 菜谱数据
recipes.forEach(recipe => {
  db.collection('recipes').add({ data: recipe })
})
```

## 数据结构

### recipes 集合字段

```javascript
{
  _id: String,           // 自动生成的文档ID
  name: String,          // 菜谱名称
  emoji: String,         // 表情符号
  authorId: String,      // 作者openid
  authorName: String,    // 作者昵称
  createTime: String,    // 创建时间（显示用）
  uploadTime: Number,    // 上传时间戳
  totalPrice: String,    // 总价
  dishImages: Array,     // 菜品图片
  ingredientItems: Array,// 食材列表
  steps: Array,          // 步骤
  likes: Number,         // 点赞数
  likedUsers: Array,     // 点赞用户openid数组
  status: String,        // 状态
  _createTime: Date,     // 系统创建时间
  _updateTime: Date      // 系统更新时间
}
```

### users 集合字段

```javascript
{
  _id: String,           // openid作为文档ID
  nickName: String,      // 昵称
  avatarUrl: String,     // 头像
  role: String,          // 角色
  myRecipes: Array,      // 我的菜谱ID
  history: Array,        // 浏览历史
  favorites: Array,      // 收藏
  notifications: Array,  // 通知
  badges: Object,        // 徽章
  likedRecipes: Array,   // 点赞的菜谱
  _createTime: Date,
  _updateTime: Date
}
```

## 本地开发 vs 云开发

### 本地开发模式

- 数据存储在 `wx.storage`
- 适合开发和测试
- 切换方式：在 `app.js` 中设置 `forceLocal: true`

### 云开发模式

- 数据存储在云数据库
- 支持多用户、实时同步
- 自动切换：云开发可用时自动使用

## 常见问题

### Q: 云函数调用失败？

A: 检查：
1. 云函数是否已部署
2. 环境 ID 是否正确配置
3. 数据库权限是否设置正确

### Q: 数据不显示？

A: 检查：
1. 数据库集合是否已创建
2. 数据是否存在（可使用云开发控制台查看）
3. 权限设置是否正确

### Q: 如何切换回本地模式？

A: 在 `app.js` 中修改：
```javascript
storage.setForceLocal(true); // 强制使用本地存储
```

## 云函数本地调试

1. 右键云函数目录 → **"开启本地调试"**
2. 在本地调试面板中查看日志
3. 修改代码后保存自动重新加载

## 监控和日志

- 在云开发控制台查看调用日志
- 监控数据库读写次数
- 查看云函数执行时间和内存使用
