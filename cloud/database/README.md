# 云数据库配置

## 集合设计

### 1. recipes - 菜谱集合
```json
{
  "_id": "string",           // 文档ID
  "name": "string",          // 菜谱名称
  "emoji": "string",         // 表情符号
  "authorId": "string",      // 作者openid
  "authorName": "string",    // 作者昵称
  "createTime": "string",    // 创建时间（显示用）
  "uploadTime": "number",    // 上传时间戳（排序用）
  "totalPrice": "string",    // 总价
  "dishImages": ["string"],  // 菜品图片数组
  "ingredientItems": [{      // 食材列表
    "name": "string",
    "qty": "string",
    "unit": "string",
    "price": "string",
    "image": "string"
  }],
  "steps": [{                // 步骤
    "content": "string",
    "image": "string"
  }],
  "likes": "number",         // 点赞数
  "likedUsers": ["string"],  // 点赞用户openid数组
  "status": "string",        // 状态: published/draft/deleted
  "_createTime": "date",     // 系统创建时间
  "_updateTime": "date"      // 系统更新时间
}
```

### 2. users - 用户集合
```json
{
  "_id": "string",           // openid作为文档ID
  "nickName": "string",      // 昵称
  "avatarUrl": "string",     // 头像URL
  "role": "string",          // 角色: admin/user
  "myRecipes": ["string"],   // 我的菜谱ID列表
  "history": ["string"],     // 浏览历史ID列表
  "favorites": ["string"],   // 收藏菜谱ID列表
  "notifications": [{        // 通知列表
    "id": "string",
    "type": "string",
    "recipeId": "string",
    "recipeName": "string",
    "message": "string",
    "time": "string",
    "read": "boolean"
  }],
  "badges": {                // 徽章信息
    "uploadLevel": "number",
    "likeLevel": "number",
    "uploadCount": "number",
    "likeCount": "number"
  },
  "likedRecipes": ["string"], // 我点赞的菜谱ID
  "_createTime": "date",
  "_updateTime": "date"
}
```

### 3. notifications - 通知集合（可选，用于大数据量场景）
```json
{
  "_id": "string",
  "userId": "string",        // 接收者openid
  "type": "string",          // 类型: like/system
  "recipeId": "string",
  "recipeName": "string",
  "message": "string",
  "time": "date",
  "read": "boolean",
  "_createTime": "date"
}
```

### 4. history - 浏览历史集合（可选，用于大数据量场景）
```json
{
  "_id": "string",
  "userId": "string",
  "recipeId": "string",
  "viewTime": "date",
  "_createTime": "date"
}
```

## 索引建议

### recipes 集合
```javascript
// 按上传时间排序
db.collection('recipes').createIndex({ uploadTime: -1 })

// 按点赞数排序
db.collection('recipes').createIndex({ likes: -1 })

// 按作者查询
db.collection('recipes').createIndex({ authorId: 1 })

// 按状态查询
db.collection('recipes').createIndex({ status: 1 })
```

### users 集合
```javascript
// 按角色查询
db.collection('users').createIndex({ role: 1 })
```

### notifications 集合
```javascript
// 按用户和时间查询
db.collection('notifications').createIndex({ userId: 1, time: -1 })

// 按已读状态查询
db.collection('notifications').createIndex({ userId: 1, read: 1 })
```

### history 集合
```javascript
// 按用户和时间查询
db.collection('history').createIndex({ userId: 1, viewTime: -1 })
```

## 权限规则

已在 `rules.json` 中配置：

1. **recipes**: 所有人可读，只有作者或管理员可写
2. **users**: 所有人可读，只有本人或管理员可写
3. **notifications**: 仅本人可读写
4. **history**: 仅本人可读写

## 数据迁移

从本地存储迁移到云数据库：

```javascript
// 在开发者工具控制台执行
const localRecipes = wx.getStorageSync('local_db_recipes') || [];
const db = wx.cloud.database();

localRecipes.forEach(recipe => {
  delete recipe._id; // 删除本地ID，让云数据库自动生成
  db.collection('recipes').add({
    data: recipe
  });
});
```
