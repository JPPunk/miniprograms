// 点赞服务云函数
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
      case 'toggleLike':
        return await toggleLike(openid, data.recipeId)
      case 'isLiked':
        return await isLiked(openid, data.recipeId)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('[Likes] Error:', error)
    return { success: false, error: error.message }
  }
}

// 切换点赞状态
async function toggleLike(openid, recipeId) {
  // 获取菜谱信息
  const recipeRes = await db.collection('recipes').doc(recipeId).get()
  const recipe = recipeRes.data
  
  if (!recipe) {
    return { success: false, message: '菜谱不存在' }
  }
  
  // 获取用户信息
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  
  const likedRecipes = user.likedRecipes || []
  const isLiked = likedRecipes.indexOf(recipeId) > -1
  
  if (isLiked) {
    // 取消点赞
    await db.collection('recipes').doc(recipeId).update({
      data: {
        likes: _.inc(-1),
        likedUsers: _.pull(openid),
        _updateTime: db.serverDate()
      }
    })
    
    await db.collection('users').doc(openid).update({
      data: {
        likedRecipes: _.pull(recipeId),
        _updateTime: db.serverDate()
      }
    })
    
    return { 
      success: true, 
      isLiked: false, 
      recipeId: recipeId,
      badgeUpgraded: false 
    }
  } else {
    // 添加点赞
    await db.collection('recipes').doc(recipeId).update({
      data: {
        likes: _.inc(1),
        likedUsers: _.addToSet(openid),
        _updateTime: db.serverDate()
      }
    })
    
    await db.collection('users').doc(openid).update({
      data: {
        likedRecipes: _.addToSet(recipeId),
        _updateTime: db.serverDate()
      }
    })
    
    // 检查徽章升级
    const badgeResult = await checkLikeBadge(openid)
    
    // 发送通知给作者（如果不是自己点赞自己）
    if (recipe.authorId !== openid) {
      await addNotification(recipe.authorId, {
        type: 'like',
        recipeId: recipeId,
        recipeName: recipe.name,
        message: '有人点赞了你的菜谱'
      })
    }
    
    return { 
      success: true, 
      isLiked: true, 
      recipeId: recipeId,
      badgeUpgraded: badgeResult.upgraded,
      newBadge: badgeResult.badge
    }
  }
}

// 检查是否已点赞
async function isLiked(openid, recipeId) {
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  
  const likedRecipes = user.likedRecipes || []
  const isLiked = likedRecipes.indexOf(recipeId) > -1
  
  return { success: true, isLiked }
}

// 检查点赞徽章
async function checkLikeBadge(openid) {
  const tiers = [
    { level: 1, count: 5, name: '伯乐初现', emoji: '❤️', desc: '给别人点了5个赞' },
    { level: 2, count: 20, name: '赞美之王', emoji: '🔥', desc: '已点20个赞' },
    { level: 3, count: 50, name: '知心评委', emoji: '⭐', desc: '已点50个赞' },
    { level: 4, count: 100, name: '超级点赞官', emoji: '💎', desc: '已点100个赞' }
  ]
  
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  
  const likedRecipes = user.likedRecipes || []
  const likeCount = likedRecipes.length
  const currentLevel = user.badges?.likeLevel || 0
  
  let newLevel = 0
  let newBadge = null
  
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (likeCount >= tiers[i].count) {
      newLevel = tiers[i].level
      newBadge = tiers[i]
      break
    }
  }
  
  const upgraded = newLevel > currentLevel
  
  if (upgraded) {
    await db.collection('users').doc(openid).update({
      data: {
        'badges.likeLevel': newLevel,
        'badges.likeCount': likeCount,
        _updateTime: db.serverDate()
      }
    })
  }
  
  return { upgraded, newLevel, badge: newBadge }
}

// 添加通知
async function addNotification(userId, notification) {
  const userRes = await db.collection('users').doc(userId).get()
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
  
  await db.collection('users').doc(userId).update({
    data: {
      notifications: notifications,
      _updateTime: db.serverDate()
    }
  })
}
