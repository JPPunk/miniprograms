// 菜谱管理云函数
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
      case 'create':
        return await createRecipe(openid, data)
      case 'update':
        return await updateRecipe(openid, data)
      case 'delete':
        return await deleteRecipe(openid, data.recipeId)
      case 'getById':
        return await getRecipeById(data.recipeId)
      case 'getAll':
        return await getAllRecipes(data)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('[RecipeManage] Error:', error)
    return { success: false, error: error.message }
  }
}

// 创建菜谱
async function createRecipe(openid, data) {
  const recipe = {
    name: data.name.trim(),
    emoji: data.emoji || '🍽️',
    authorId: openid,
    authorName: data.authorName || '微信用户',
    createTime: new Date().toLocaleDateString('zh-CN'),
    uploadTime: Date.now(),
    totalPrice: data.totalPrice || '0.00',
    dishImages: data.dishImages || [],
    ingredientItems: (data.ingredientItems || []).filter(i => i.name.trim()),
    steps: (data.steps || []).filter(s => s.content.trim()),
    likes: 0,
    likedUsers: [],
    status: 'published',
    _createTime: db.serverDate(),
    _updateTime: db.serverDate()
  }
  
  const res = await db.collection('recipes').add({ data: recipe })
  
  // 更新用户的我的菜谱
  await db.collection('users').doc(openid).update({
    data: {
      myRecipes: _.addToSet(res._id),
      _updateTime: db.serverDate()
    }
  })
  
  // 检查徽章
  const badgeResult = await checkUploadBadge(openid)
  
  return { 
    success: true, 
    recipeId: res._id,
    badgeUpgraded: badgeResult.upgraded,
    newBadge: badgeResult.badge
  }
}

// 更新菜谱
async function updateRecipe(openid, data) {
  const { recipeId, ...updateData } = data
  
  // 检查权限
  const recipeRes = await db.collection('recipes').doc(recipeId).get()
  const recipe = recipeRes.data
  
  if (!recipe) {
    return { success: false, message: '菜谱不存在' }
  }
  
  // 检查是否是作者或管理员
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  
  if (recipe.authorId !== openid && user.role !== 'admin') {
    return { success: false, message: '无权限修改' }
  }
  
  // 过滤不允许更新的字段
  const allowedFields = ['name', 'emoji', 'totalPrice', 'dishImages', 'ingredientItems', 'steps']
  const filteredData = {}
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field]
    }
  })
  
  filteredData._updateTime = db.serverDate()
  
  await db.collection('recipes').doc(recipeId).update({
    data: filteredData
  })
  
  return { success: true, recipeId }
}

// 删除菜谱
async function deleteRecipe(openid, recipeId) {
  // 检查权限
  const recipeRes = await db.collection('recipes').doc(recipeId).get()
  const recipe = recipeRes.data
  
  if (!recipe) {
    return { success: false, message: '菜谱不存在' }
  }
  
  // 检查是否是作者或管理员
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  
  if (recipe.authorId !== openid && user.role !== 'admin') {
    return { success: false, message: '无权限删除' }
  }
  
  // 软删除
  await db.collection('recipes').doc(recipeId).update({
    data: {
      status: 'deleted',
      _updateTime: db.serverDate()
    }
  })
  
  // 从用户的我的菜谱中移除
  await db.collection('users').doc(recipe.authorId).update({
    data: {
      myRecipes: _.pull(recipeId),
      _updateTime: db.serverDate()
    }
  })
  
  return { success: true }
}

// 获取单个菜谱
async function getRecipeById(recipeId) {
  const res = await db.collection('recipes').doc(recipeId).get()
  
  if (!res.data) {
    return { success: false, message: '菜谱不存在' }
  }
  
  return { success: true, data: res.data }
}

// 获取菜谱列表
async function getAllRecipes(data) {
  const { where = {}, order = {}, limit = 100 } = data
  
  let query = db.collection('recipes').where({
    status: 'published',
    ...where
  })
  
  if (order.field) {
    query = query.orderBy(order.field, order.order || 'desc')
  }
  
  query = query.limit(limit)
  
  const res = await query.get()
  
  return { success: true, data: res.data }
}

// 检查上传徽章
async function checkUploadBadge(openid) {
  const tiers = [
    { level: 1, count: 1, name: '厨房新手', emoji: '🌱', desc: '上传了第一个菜谱' },
    { level: 2, count: 5, name: '家庭厨师', emoji: '🍳', desc: '已上传5个菜谱' },
    { level: 3, count: 15, name: '美食达人', emoji: '👨‍🍳', desc: '已上传15个菜谱' },
    { level: 4, count: 30, name: '厨神', emoji: '🏅', desc: '已上传30个菜谱' }
  ]
  
  const userRes = await db.collection('users').doc(openid).get()
  const user = userRes.data
  
  const myRecipes = user.myRecipes || []
  const uploadCount = myRecipes.length + 1 // +1 因为刚上传了新菜谱
  const currentLevel = user.badges?.uploadLevel || 0
  
  let newLevel = 0
  let newBadge = null
  
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (uploadCount >= tiers[i].count) {
      newLevel = tiers[i].level
      newBadge = tiers[i]
      break
    }
  }
  
  const upgraded = newLevel > currentLevel
  
  if (upgraded) {
    await db.collection('users').doc(openid).update({
      data: {
        'badges.uploadLevel': newLevel,
        'badges.uploadCount': uploadCount,
        _updateTime: db.serverDate()
      }
    })
  }
  
  return { upgraded, newLevel, badge: newBadge }
}
