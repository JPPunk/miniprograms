// 排行榜云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

exports.main = async (event, context) => {
  const { action, data } = event
  
  try {
    switch (action) {
      case 'byLikes':
        return await getRankingsByLikes(data.limit)
      case 'byPrice':
        return await getRankingsByPrice(data.limit)
      case 'byValue':
        return await getRankingsByValue(data.limit)
      case 'byTime':
        return await getRankingsByTime(data.limit)
      case 'getMyRecipes':
        return await getMyRecipes(data.openid)
      case 'getFavorites':
        return await getFavorites(data.openid)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('[Rankings] Error:', error)
    return { success: false, error: error.message }
  }
}

// 按点赞数排序
async function getRankingsByLikes(limit = 100) {
  const res = await db.collection('recipes')
    .where({ status: 'published' })
    .orderBy('likes', 'desc')
    .limit(limit)
    .get()
  
  return { success: true, data: res.data }
}

// 按价格排序（从低到高）
async function getRankingsByPrice(limit = 100) {
  // 需要解析价格字符串为数字
  const res = await db.collection('recipes')
    .where({ status: 'published' })
    .orderBy('totalPrice', 'asc')
    .limit(limit)
    .get()
  
  // 转换为数字排序
  const sorted = res.data.sort((a, b) => {
    const priceA = parseFloat(a.totalPrice) || 0
    const priceB = parseFloat(b.totalPrice) || 0
    return priceA - priceB
  })
  
  return { success: true, data: sorted }
}

// 按性价比排序（点赞数/价格）
async function getRankingsByValue(limit = 100) {
  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  
  // 获取近一个月的菜谱
  const res = await db.collection('recipes')
    .where({
      status: 'published',
      uploadTime: _.gt(oneMonthAgo)
    })
    .limit(200)
    .get()
  
  // 计算性价比并排序
  const recipes = res.data.map(recipe => {
    const price = parseFloat(recipe.totalPrice) || 1
    const likes = recipe.likes || 0
    const valueScore = likes / price
    return { ...recipe, valueScore }
  })
  
  const sorted = recipes.sort((a, b) => b.valueScore - a.valueScore)
  
  return { success: true, data: sorted.slice(0, limit) }
}

// 按时间排序（最新上传）
async function getRankingsByTime(limit = 100) {
  const res = await db.collection('recipes')
    .where({ status: 'published' })
    .orderBy('uploadTime', 'desc')
    .limit(limit)
    .get()
  
  return { success: true, data: res.data }
}

// 获取我的菜谱
async function getMyRecipes(openid) {
  const res = await db.collection('recipes')
    .where({
      authorId: openid,
      status: 'published'
    })
    .orderBy('uploadTime', 'desc')
    .get()
  
  return { success: true, data: res.data }
}

// 获取收藏的菜谱
async function getFavorites(openid) {
  // 先获取用户的收藏列表
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  const favoriteIds = user.favorites || []
  
  if (favoriteIds.length === 0) {
    return { success: true, data: [] }
  }
  
  // 获取菜谱详情
  const recipesRes = await db.collection('recipes')
    .where({
      _id: _.in(favoriteIds),
      status: 'published'
    })
    .get()
  
  return { success: true, data: recipesRes.data }
}
