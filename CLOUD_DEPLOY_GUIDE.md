# 妙算小厨 - 云开发完整部署方案

> 环境 ID: `cloudbase-d7g0ms7t6569c7e0e`

---

## 一、准备工作

### 1. 确认环境信息

打开微信开发者工具，确认：
- ✅ 已登录微信开发者工具
- ✅ 小程序 AppID: `wxc29e2adc86e681d6`
- ✅ 云开发环境: `cloudbase-d7g0ms7t6569c7e0e`

### 2. 打开云开发控制台

点击开发者工具工具栏的 **"云开发"** 按钮，打开控制台。

---

## 二、清理旧数据（可选）

如果你需要完全重新部署，按以下步骤清理：

### 步骤 1: 删除云函数

1. 进入 **云开发控制台** → **云函数**
2. 勾选所有现有云函数
3. 点击 **"批量删除"**

### 步骤 2: 清空数据库

1. 进入 **云开发控制台** → **数据库**
2. 对每个集合点击 **"删除集合"**
3. 确认删除 `recipes` 和 `users` 集合

### 步骤 3: 清空存储（可选）

1. 进入 **云开发控制台** → **存储**
2. 删除所有文件（如果有上传的图片）

---

## 三、创建数据库集合

### 步骤 1: 创建 recipes 集合

1. 进入 **数据库** 标签页
2. 点击 **"添加集合"**
3. 输入集合名称: `recipes`
4. 点击确定

### 步骤 2: 创建 users 集合

1. 点击 **"添加集合"**
2. 输入集合名称: `users`
3. 点击确定

### 步骤 3: 创建索引（性能优化）

在 `recipes` 集合中创建以下索引：

#### 索引 1: uploadTime
- 字段: `uploadTime`
- 排序: 降序
- 索引名称: `uploadTime_desc`

#### 索引 2: likes
- 字段: `likes`
- 排序: 降序
- 索引名称: `likes_desc`

#### 索引 3: authorId
- 字段: `authorId`
- 排序: 升序
- 索引名称: `authorId_asc`

#### 索引 4: status
- 字段: `status`
- 排序: 升序
- 索引名称: `status_asc`

创建方法：
1. 点击集合名称进入详情
2. 点击 **"索引"** 标签
3. 点击 **"添加索引"**
4. 填写字段和排序
5. 点击确定

---

## 四、配置数据库权限

### 步骤 1: 配置 recipes 集合权限

1. 进入 `recipes` 集合
2. 点击 **"权限设置"**
3. 选择 **"自定义安全规则"**
4. 粘贴以下规则：

```json
{
  "read": true,
  "write": "doc.authorId == auth.openid || get('users/' + auth.openid).role == 'admin'"
}
```

5. 点击 **"保存"**

### 步骤 2: 配置 users 集合权限

1. 进入 `users` 集合
2. 点击 **"权限设置"**
3. 选择 **"自定义安全规则"**
4. 粘贴以下规则：

```json
{
  "read": true,
  "write": "doc._id == auth.openid || get('users/' + auth.openid).role == 'admin'"
}
```

5. 点击 **"保存"**

---

## 五、部署云函数

### 云函数 1: recipes（登录验证）

1. 在微信开发者工具中，展开 `cloud/functions/recipes`
2. **右键点击** `recipes` 文件夹
3. 选择 **"创建并部署：云端安装依赖"**
4. 等待部署完成（底部控制台显示成功信息）

### 云函数 2: users（用户管理）

1. **右键点击** `cloud/functions/users`
2. 选择 **"创建并部署：云端安装依赖"**
3. 等待部署完成

### 云函数 3: rankings（排行榜）

1. **右键点击** `cloud/functions/rankings`
2. 选择 **"创建并部署：云端安装依赖"**
3. 等待部署完成

### 云函数 4: likes（点赞）

1. **右键点击** `cloud/functions/likes`
2. 选择 **"创建并部署：云端安装依赖"**
3. 等待部署完成

### 云函数 5: recipeManage（菜谱管理）

1. **右键点击** `cloud/functions/recipeManage`
2. 选择 **"创建并部署：云端安装依赖"**
3. 等待部署完成

### 验证部署

1. 进入 **云开发控制台** → **云函数**
2. 确认以下云函数已显示：
   - ✅ recipes
   - ✅ users
   - ✅ rankings
   - ✅ likes
   - ✅ recipeManage

---

## 六、初始化测试数据

### 方法 1: 通过小程序自动初始化

1. 在开发者工具中点击 **"编译"**
2. 小程序启动时会自动检查并初始化数据
3. 如果数据库为空，会自动创建示例数据

### 方法 2: 手动导入 Mock 数据

如果需要在控制台手动导入：

#### 导入 recipes 数据

1. 进入 **数据库** → `recipes` 集合
2. 点击 **"添加文档"**
3. 选择 **"导入 JSON"**
4. 粘贴以下示例数据：

```json
{
  "name": "红烧肉",
  "emoji": "🥩",
  "authorId": "test_user",
  "authorName": "我",
  "createTime": "2026/5/1",
  "uploadTime": 1714500000000,
  "totalPrice": "42.80",
  "dishImages": [],
  "ingredientItems": [
    { "name": "五花肉", "qty": "500", "unit": "克(g)", "price": "28.00", "image": "" },
    { "name": "冰糖", "qty": "30", "unit": "克(g)", "price": "3.00", "image": "" },
    { "name": "生抽", "qty": "2", "unit": "勺", "price": "2.00", "image": "" }
  ],
  "steps": [
    { "content": "五花肉切2cm方块，冷水下锅焯水3分钟", "image": "" },
    { "content": "锅中少许油，放冰糖小火炒至枣红色", "image": "" }
  ],
  "likes": 256,
  "likedUsers": ["user_lisi", "user_wangwu"],
  "status": "published"
}
```

#### 导入 users 数据

1. 进入 **数据库** → `users` 集合
2. 点击 **"添加文档"**
3. 输入文档 ID: `test_user`
4. 粘贴以下数据：

```json
{
  "nickName": "我",
  "avatarUrl": "",
  "role": "user",
  "myRecipes": [],
  "history": [],
  "favorites": [],
  "notifications": [],
  "badges": {
    "uploadLevel": 0,
    "likeLevel": 0,
    "uploadCount": 0,
    "likeCount": 0
  },
  "likedRecipes": []
}
```

---

## 七、验证部署结果

### 测试 1: 登录验证

1. 在开发者工具控制台输入：
```javascript
wx.cloud.callFunction({
  name: 'recipes',
  data: { action: 'login' }
}).then(res => console.log('登录成功:', res))
```

2. 应该返回包含 `openid` 的成功响应

### 测试 2: 获取菜谱列表

```javascript
wx.cloud.callFunction({
  name: 'rankings',
  data: { action: 'byTime', data: { limit: 10 } }
}).then(res => console.log('菜谱列表:', res.result.data))
```

### 测试 3: 创建菜谱

```javascript
wx.cloud.callFunction({
  name: 'recipeManage',
  data: {
    action: 'create',
    data: {
      name: '测试菜谱',
      emoji: '🍳',
      totalPrice: '10.00',
      dishImages: [],
      ingredientItems: [{ name: '鸡蛋', qty: '2', unit: '个', price: '4.00' }],
      steps: [{ content: '打鸡蛋', image: '' }]
    }
  }
}).then(res => console.log('创建成功:', res))
```

---

## 八、常见问题排查

### 问题 1: 云函数部署失败

**解决步骤：**
1. 检查 `cloud/functions/xxx/package.json` 是否存在
2. 检查 `cloud/functions/xxx/index.js` 是否存在
3. 确保 Node.js 版本 >= 14
4. 尝试 **"上传并部署：云端安装依赖（不上传 node_modules）"**

### 问题 2: 数据库权限错误

**错误信息：** `permission denied`

**解决：**
1. 检查数据库权限规则是否正确设置
2. 确认 `auth.openid` 可以正确获取
3. 尝试暂时设置为 **"所有用户可读，仅创建者可写"**

### 问题 3: 云函数调用超时

**解决：**
1. 检查云函数代码是否有死循环
2. 在云函数配置中增加超时时间（默认 3s，可增加到 20s）
3. 优化数据库查询，添加索引

### 问题 4: 数据不显示

**排查步骤：**
1. 打开开发者工具 **"调试器"** → **"Console"**
2. 查看是否有错误日志
3. 检查网络请求：**"Network"** 面板
4. 确认云开发环境 ID 正确

---

## 九、本地开发模式切换

如果需要切换回本地存储模式进行开发：

修改 `miniprogram/app.js`：

```javascript
onLaunch: function () {
  // 强制使用本地存储
  storage.setForceLocal(true);
  
  // ... 其余代码
}
```

切换回云开发模式：

```javascript
onLaunch: function () {
  // 自动检测云开发
  storage.setForceLocal(false);
  
  // ... 其余代码
}
```

---

## 十、部署检查清单

部署完成后，请确认以下项目：

### 数据库
- [ ] `recipes` 集合已创建
- [ ] `users` 集合已创建
- [ ] 索引已创建（uploadTime, likes, authorId, status）
- [ ] 权限规则已设置

### 云函数
- [ ] recipes 云函数已部署
- [ ] users 云函数已部署
- [ ] rankings 云函数已部署
- [ ] likes 云函数已部署
- [ ] recipeManage 云函数已部署

### 测试验证
- [ ] 登录接口正常
- [ ] 获取菜谱列表正常
- [ ] 创建菜谱正常
- [ ] 点赞功能正常
- [ ] 排行榜显示正常

---

## 附录：文件结构

```
miniprogram/
├── cloud/
│   ├── functions/
│   │   ├── recipes/          # 登录验证
│   │   │   ├── index.js
│   │   │   ├── package.json
│   │   │   └── config.json
│   │   ├── users/            # 用户管理
│   │   │   ├── index.js
│   │   │   ├── package.json
│   │   │   └── config.json
│   │   ├── rankings/         # 排行榜
│   │   │   ├── index.js
│   │   │   ├── package.json
│   │   │   └── config.json
│   │   ├── likes/            # 点赞
│   │   │   ├── index.js
│   │   │   ├── package.json
│   │   │   └── config.json
│   │   └── recipeManage/     # 菜谱管理
│   │       ├── index.js
│   │       ├── package.json
│   │       └── config.json
│   └── database/
│       ├── rules.json        # 权限规则
│       └── README.md         # 数据库文档
├── miniprogram/
│   ├── app.js                # 应用入口（已配置云开发）
│   ├── services/
│   │   └── storage.js        # 存储抽象层
│   └── utils/
│       └── dataHelper.js     # 数据访问层
└── CLOUD_DEPLOY.md           # 本部署文档
```

---

**部署完成！** 🎉

现在你可以开始使用云开发环境运行小程序了。
