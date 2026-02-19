import jwt from 'jsonwebtoken'

const JWT_SECRET = 'novel-platform-secret-key-2024'

export function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: '未登录' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.username = decoded.username
    req.userRole = decoded.role
    next()
  } catch (error) {
    return res.status(401).json({ error: 'token无效' })
  }
}

export function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' })
  }
  next()
}
