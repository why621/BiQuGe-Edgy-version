import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import novelRoutes from './routes/novels.js'
import authRoutes from './routes/auth.js'
import aiRoutes from './routes/ai.js'
import uploadRoutes from './routes/upload.js'
import { initDatabase } from './database/init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const isProduction = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api/novels', novelRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/upload', uploadRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '小说平台服务运行正常' })
})

if (isProduction) {
  const clientPath = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientPath))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'))
  })
}

try {
  initDatabase()
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`小说平台服务运行在 http://0.0.0.0:${PORT}`)
    console.log(`环境: ${isProduction ? '生产环境' : '开发环境'}`)
  })
} catch (err) {
  console.error('数据库初始化失败:', err)
  process.exit(1)
}
