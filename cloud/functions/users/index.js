// 用户服务云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, data } = event
  const openid = wxContext.OPENID
  
  try {
    switch (action) {
      case 'getUserInfo':
        return await getUserInfo(openid)
      case 'updateUserInfo':
        return await updateUserInfo(openid, data)
      case 'updateMyRecipes':
        return await updateMyRecipes(openid, data.recipeId)
      case 'addHistory':
        return await addHistory(openid, data.recipeId)
      case 'getHistory':
        return await getHistory(openid)
      case 'clearHistory':
        return await clearHistory(openid)
      case 'addFavorite':
        return await addFavorite(openid, data.recipeId)
      case 'removeFavorite':
        return await removeFavorite(openid, data.recipeId)
      case 'getFavorites':
        return await getFavorites(openid)
      case 'updateBadges':
        return await updateBadges(openid, data.badges)
      case 'addNotification':
        return await addNotification(openid, data.notification)
      case 'markNotificationRead':
        return await markNotificationRead(openid, data.notificationId)
      case 'getUnreadCount':
        return await getUnreadCount(openid)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('[Users] Error:', error)
    return { success: false, error: error.message }
  }
}

// 获取用户信息
async function getUserInfo(openid) {
  const userRes = await db.collection('users').doc(openid).get()
  
  if (!userRes.data) {
    // 创建默认用户
    const defaultUser = {
      _id: openid,
      nickName: '微信用户',
      avatarUrl: '',
      role: 'user',
      myRecipes: [],
      history: [],
      favorites: [],
      notifications: [],
      badges: { uploadLevel: 0, likeLevel: 0, uploadCount: 0, likeCount: 0 },
      likedRecipes: [],
      _createTime: db.serverDate(),
      _updateTime: db.serverDate()
    }
    await db.collection('users').add({ data: defaultUser })
    return { success: true, data: defaultUser }
  }
  
  return { success: true, data: userRes.data }
}

// 更新用户信息
async function updateUserInfo(openid, data) {
  const updateData = {
    ...data,
    _updateTime: db.serverDate()
  }
  
  await db.collection('users').doc(openid).update({
    data: updateData
  })
  
  return { success: true }
}

// 更新我的菜谱
async function updateMyRecipes(openid, recipeId) {
  await db.collection('users').doc(openid).update({
    data: {
      myRecipes: _.addToSet(recipeId),
      _updateTime: db.serverDate()
    }
  })
  
  // 更新徽章计数
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  const uploadCount = user.myRecipes ? user.myRecipes.length + 1 : 1
  
  await updateUploadBadge(openid, uploadCount)
  
  return { success: true }
}

// 更新上传徽章
async function updateUploadBadge(openid, count) {
  const tiers = [
    { level: 1, count: 1, name: '厨房新手' },
    { level: 2, count: 5, name: '家庭厨师' },
    { level: 3, count: 15, name: '美食达人' },
    { level: 4, count: 30, name: '厨神' }
  ]
  
  let newLevel = 0
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (count >= tiers[i].count) {
      newLevel = tiers[i].level
      break
    }
  }
  
  await db.collection('users').doc(openid).update({
    data: {
      'badges.uploadLevel': newLevel,
      'badges.uploadCount': count,
      _updateTime: db.serverDate()
    }
  })
  
  return { success: true, newLevel }
}

// 添加浏览历史
async function addHistory(openid, recipeId) {
  const MAX_HISTORY = 50
  
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  
  let history = user.history || []
  history = history.filter(id => id !== recipeId)
  history.unshift(recipeId)
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY)
  }
  
  await db.collection('users').doc(openid).update({
    data: {
      history: history,
      _updateTime: db.serverDate()
    }
  })
  
  return { success: true }
}

// 获取浏览历史
async function getHistory(openid) {
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  const historyIds = user.history || []
  
  if (historyIds.length === 0) {
    return { success: true, data: [] }
  }
  
  // 获取菜谱详情
  const recipesRes = await db.collection('recipes')
    .where({
      _id: _.in(historyIds)
    })
    .get()
  
  // 按历史顺序排序
  const recipeMap = {}
  recipesRes.data.forEach(r => recipeMap[r._id] = r)
  const sortedRecipes = historyIds
    .map(id => recipeMap[id])
    .filter(Boolean)
  
  return { success: true, data: sortedRecipes }
}

// 清空浏览历史
async function clearHistory(openid) {
  await db.collection('users').doc(openid).update({
    data: {
      history: [],
      _updateTime: db.serverDate()
    }
  })
  
  return { success: true }
}

// 添加收藏
async function addFavorite(openid, recipeId) {
  await db.collection('users').doc(openid).update({
    data: {
      favorites: _.addToSet(recipeId),
      _updateTime: db.serverDate()
    }
  })
  
  return { success: true }
}

// 移除收藏
async function removeFavorite(openid, recipeId) {
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  
  const favorites = (user.favorites || []).filter(id => id !== recipeId)
  
  await db.collection('users').doc(openid).update({
    data: {
      favorites: favorites,
      _updateTime: db.serverDate()
    }
  })
  
  return { success: true }
}

// 获取收藏列表
async function getFavorites(openid) {
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  const favoriteIds = user.favorites || []
  
  if (favoriteIds.length === 0) {
    return { success: true, data: [] }
  }
  
  const recipesRes = await db.collection('recipes')
    .where({
      _id: _.in(favoriteIds)
    })
    .get()
  
  return { success: true, data: recipesRes.data }
}

// 更新徽章
async function updateBadges(openid, badges) {
  await db.collection('users').doc(openid).update({
    data: {
      badges: badges,
      _updateTime: db.serverDate()
    }
  })
  
  return { success: true }
}

// 添加通知
async function addNotification(openid, notification) {
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  
  let notifications = user.notifications || []
  notifications.unshift({
    ...notification,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    time: new Date().toLocaleString('zh-CN'),
    read: false
  })
  
  // 限制通知数量
  if (notifications.length > 100) {
    notifications = notifications.slice(0, 100)
  }
  
  await db.collection('users').doc(openid).update({
    data: {
      notifications: notifications,
      _updateTime: db.serverDate()
    }
  })
  
  return { success: true }
}

// 标记通知已读
async function markNotificationRead(openid, notificationId) {
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  
  let notifications = user.notifications || []
  notifications = notifications.map(n => {
    if (n.id === notificationId) {
      return { ...n, read: true }
    }
    return n
  })
  
  await db.collection('users').doc(openid).update({
    data: {
      notifications: notifications,
      _updateTime: db.serverDate()
    }
  })
  
  return { success: true }
}

// 获取未读通知数
async function getUnreadCount(openid) {
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  const notifications = user.notifications || []
  
  const count = notifications.filter(n => !n.read).length
  
  return { success: true, count }
}
