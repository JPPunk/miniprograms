// 云函数入口文件 - 登录和批量操作
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 主入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, data } = event
  
  try {
    switch (action) {
      case 'login':
        return await handleLogin(wxContext)
      case 'verify':
        return await handleVerify(wxContext)
      case 'batchAdd':
        return await handleBatchAdd(data)
      default:
        return { 
          success: true, 
          openid: wxContext.OPENID,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
          env: cloud.DYNAMIC_CURRENT_ENV
        }
    }
  } catch (error) {
    console.error('[CloudFunction] Error:', error)
    return { 
      success: true, // 保持兼容
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      error: error.message 
    }
  }
}

// 登录验证
async function handleLogin(wxContext) {
  const { OPENID, APPID } = wxContext
  
  try {
    // 检查用户是否存在
    const userRes = await db.collection('users').doc(OPENID).get()
    
    if (!userRes.data) {
      // 创建新用户
      await db.collection('users').add({
        data: {
          _id: OPENID,
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
      })
    }
    
    return {
      success: true,
      openid: OPENID,
      appid: APPID
    }
  } catch (e) {
    // 用户不存在会报错，直接创建
    await db.collection('users').add({
      data: {
        _id: OPENID,
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
    })
    
    return {
      success: true,
      openid: OPENID,
      appid: APPID
    }
  }
}

// 环境验证
async function handleVerify(wxContext) {
  const { OPENID } = wxContext
  
  try {
    // 测试数据库连接
    await db.collection('recipes').limit(1).get()
    
    return {
      success: true,
      openid: OPENID,
      env: cloud.DYNAMIC_CURRENT_ENV
    }
  } catch (e) {
    return {
      success: false,
      message: '数据库连接失败: ' + e.message
    }
  }
}

// 批量添加文档
async function handleBatchAdd(data) {
  const { collection, docs } = data
  
  if (!collection || !docs || docs.length === 0) {
    return { success: false, message: '参数错误' }
  }
  
  const ids = []
  
  // 由于云函数有执行时间限制，分批处理
  const batchSize = 10
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize)
    const tasks = batch.map(doc => {
      const docData = {
        ...doc,
        _createTime: db.serverDate(),
        _updateTime: db.serverDate()
      }
      delete docData._id // 删除本地ID
      
      return db.collection(collection).add({ data: docData })
    })
    
    const results = await Promise.all(tasks)
    results.forEach(res => ids.push(res._id))
  }
  
  return { success: true, ids }
}
