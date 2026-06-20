# ChefRank（妙算小厨）- 部署教程

## 📋 项目信息

| 项目 | 详情 |
|------|------|
| **名称** | ChefRank（妙算小厨） |
| **AppID** | `wx8a8bdd79631a02a0` |
| **环境 ID** | `cloudbase-d7g0ms7t6569c7e0e` |
| **仓库** | https://github.com/JPPunk/miniprograms |
| **技术栈** | 微信小程序 + 微信云开发 |

---

## 🚀 完整部署流程

### 第一步：准备环境

1. **安装微信开发者工具**
   - 下载地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
   - 安装并登录你的微信账号

2. **确认小程序账号**
   - AppID: `wx8a8bdd79631a02a0`
   - 确保该账号已注册小程序

3. **克隆代码**
   ```bash
   git clone git@github.com:JPPunk/miniprograms.git
   cd miniprograms/AI_Projects/miniprogram
   ```

---

### 第二步：导入项目

1. 打开 **微信开发者工具**
2. 点击 **"+"** → **"导入项目"**
3. **项目目录**: 选择 `/path/to/miniprograms/AI_Projects/miniprogram`
4. **AppID**: `wx8a8bdd79631a02a0`（会自动填入）
5. **后端服务**: 选择 **"微信云开发"**
6. 点击 **"确定"**

---

### 第三步：开通云开发

1. 在开发者工具中点击工具栏的 **"云开发"** 按钮（云朵图标 ☁️）
2. 点击 **"开通"**
3. 选择 **"免费版"**（开发测试）或 **"按量付费"**（生产环境）
4. 等待开通完成
5. 记录你的 **环境 ID**（格式如：`cloudbase-d7g0ms7t6569c7e0e`）

**注意**: 确保 `app.js` 中的环境 ID 配置正确：
```javascript
wx.cloud.init({
  env: 'cloudbase-d7g0ms7t6569c7e0e',
  traceUser: true
});
```

---

### 第四步：部署云函数

在微信开发者工具的资源管理器中：

1. 展开 `cloud/functions/` 目录
2. **依次右键以下文件夹**，选择 **"创建并部署：云端安装依赖"**：

   | 云函数 | 功能说明 |
   |--------|----------|
   | `recipes/` | 登录验证、菜谱查询 |
   | `users/` | 用户管理、历史记录 |
   | `rankings/` | 排行榜数据查询 |
   | `likes/` | 点赞/取消点赞 |
   | `recipeManage/` | 菜谱增删改查 |

3. 等待每个云函数部署完成（底部控制台显示成功信息）

**验证部署**:
- 进入 **云开发控制台** → **云函数**
- 确认 5 个云函数都已显示且状态正常

---

### 第五步：创建数据库集合

1. 进入 **云开发控制台** → **数据库**
2. 点击 **"添加集合"**，依次创建：

   **必需集合**:
   - `recipes` - 存储菜谱数据
   - `users` - 存储用户信息

   **可选集合**（大数据量时使用）:
   - `notifications` - 通知数据
   - `history` - 浏览历史

---

### 第六步：配置数据库权限

1. 进入 `recipes` 集合 → **"权限设置"**
2. 选择 **"自定义安全规则"**
3. 粘贴以下规则：
   ```json
   {
     "read": true,
     "write": "doc.authorId == auth.openid || get('users/' + auth.openid).role == 'admin'"
   }
   ```
4. 进入 `users` 集合 → **"权限设置"**
5. 粘贴规则：
   ```json
   {
     "read": true,
     "write": "doc._id == auth.openid || get('users/' + auth.openid).role == 'admin'"
   }
   ```

**或者**: 直接导入 `cloud/database/rules.json` 文件

---

### 第七步：创建数据库索引（性能优化）

在 `recipes` 集合中创建以下索引：

1. **uploadTime 降序索引**
   - 字段: `uploadTime`
   - 排序: 降序
   - 用途: 最新上传排序

2. **likes 降序索引**
   - 字段: `likes`
   - 排序: 降序
   - 用途: 点赞榜排序

3. **authorId 升序索引**
   - 字段: `authorId`
   - 排序: 升序
   - 用途: 按作者查询

---

### 第八步：运行项目

1. 在开发者工具中点击 **"编译"**（或按 Ctrl+S）
2. 小程序将自动初始化并加载数据
3. 如果数据库为空，会自动创建示例数据

**首次运行检查清单**:
- [ ] 首页排行榜正常显示
- [ ] 可以上传新菜谱
- [ ] 点赞功能正常
- [ ] 个人中心数据正确

---

## 📱 真机预览

### 生成预览二维码

1. 点击开发者工具工具栏的 **"预览"** 按钮
2. 使用手机微信扫描二维码
3. 在真机上测试各项功能

### 上传体验版

1. 点击 **"上传"** 按钮
2. 填写版本号（如 `1.0.0`）
3. 填写项目备注
4. 上传成功后，在微信公众平台设置为体验版

---

## 🔧 常见问题

### Q1: 导入项目时无法选择"微信云开发"？

**A**: 确保使用的是正式小程序 AppID（`wx8a8bdd79631a02a0`），测试号不支持云开发。

### Q2: 云函数部署失败？

**A**: 
1. 检查 Node.js 版本 >= 14
2. 确保 `package.json` 存在
3. 尝试 **"上传并部署：云端安装依赖（不上传 node_modules）"**

### Q3: 数据库权限错误？

**A**: 
1. 检查权限规则语法是否正确
2. 确认 `auth.openid` 可以正确获取
3. 暂时设置为 **"所有用户可读，仅创建者可写"** 测试

### Q4: 数据不显示？

**A**: 
1. 打开开发者工具 **"调试器"** → **"Console"** 查看错误
2. 检查网络请求：**"Network"** 面板
3. 确认云开发环境 ID 正确
4. 确认数据库集合已创建

### Q5: 如何切换回本地模式？

**A**: 修改 `app.js`：
```javascript
onLaunch: function () {
  storage.setForceLocal(true); // 强制使用本地存储
  // ...
}
```

---

## 📁 项目结构

```
miniprogram/
├── app.js                    # 应用入口（已配置云开发）
├── app.json                  # 全局配置
├── app.wxss                  # 全局样式
├── project.config.json       # 项目配置
├── pages/                    # 页面目录
│   ├── index/               # 首页（排行榜）
│   ├── upload/              # 上传菜谱
│   ├── my/                  # 个人中心
│   ├── detail/              # 菜谱详情
│   └── notifications/       # 消息通知
├── components/              # 公共组件
├── services/                # 业务服务层
├── utils/                   # 工具函数
└── cloud/                   # 云开发目录
    ├── functions/           # 云函数
    │   ├── recipes/
    │   ├── users/
    │   ├── rankings/
    │   ├── likes/
    │   └── recipeManage/
    └── database/            # 数据库配置
```

---

## 📚 相关文档

- [详细部署指南](./CLOUD_DEPLOY_GUIDE.md) - 完整的部署步骤和排查
- [数据库配置](./cloud/database/README.md) - 数据结构和索引设计
- [README](./README.md) - 项目介绍和开发规范

---

**部署完成！** 🎉

现在你可以开始使用 ChefRank（妙算小厨）了！
