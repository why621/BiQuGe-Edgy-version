import { Router } from 'express'
import db from '../database/init.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'novel-platform-secret-key-2024'
const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在' })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword)
    
    res.json({ success: true, userId: result.lastInsertRowid })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const isValidPassword = bcrypt.compareSync(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, username: user.username, role: user.role } 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
