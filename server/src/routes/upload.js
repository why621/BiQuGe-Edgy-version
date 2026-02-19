import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { verifyToken, requireAdmin } from '../middleware/auth.js'
import db from '../database/init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, '../../uploads')
const coversDir = path.join(uploadDir, 'covers')
const novelsDir = path.join(uploadDir, 'novels')

const dirs = [uploadDir, coversDir, novelsDir]
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cover') {
      cb(null, coversDir)
    } else if (file.fieldname === 'novel') {
      cb(null, novelsDir)
    } else {
      cb(null, uploadDir)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, uniqueSuffix + ext)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cover') {
      const allowedTypes = /jpeg|jpg|png|gif|webp/
      const ext = path.extname(file.originalname).toLowerCase()
      const mime = file.mimetype
      if (allowedTypes.test(ext) && mime.startsWith('image/')) {
        cb(null, true)
      } else {
        cb(new Error('只支持图片文件'))
      }
    } else if (file.fieldname === 'novel') {
      const allowedTypes = /txt|md|doc|docx/
      const ext = path.extname(file.originalname).toLowerCase()
      if (allowedTypes.test(ext)) {
        cb(null, true)
      } else {
        cb(new Error('只支持txt、md、doc、docx文件'))
      }
    } else {
      cb(null, true)
    }
  }
})

const router = Router()

router.post('/cover', verifyToken, upload.single('cover'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传封面图片' })
    }
    
    const coverUrl = `/uploads/covers/${req.file.filename}`
    res.json({ success: true, url: coverUrl })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/novel', verifyToken, requireAdmin, upload.single('novel'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传小说文件' })
    }

    const filePath = req.file.path
    const content = fs.readFileSync(filePath, 'utf-8')
    
    res.json({ 
      success: true, 
      content,
      filename: req.file.originalname
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/parse', verifyToken, (req, res) => {
  try {
    const { content, title } = req.body
    
    if (!content) {
      return res.status(400).json({ error: '内容不能为空' })
    }

    const chapters = parseNovelContent(content)
    
    res.json({ 
      success: true, 
      chapters,
      totalChapters: chapters.length
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

function parseNovelContent(content) {
  const chapters = []
  const lines = content.split('\n')
  
  const chapterPatterns = [
    /^第[一二三四五六七八九十百千万零\d]+[章节回][\s\S]*/,
    /^Chapter\s*\d+[\s\S]*/i,
    /^[第]?\d+[章节回][\s\S]*/
  ]
  
  let currentChapter = null
  let chapterNumber = 0
  
  for (const line of lines) {
    let isChapterTitle = false
    
    for (const pattern of chapterPatterns) {
      if (pattern.test(line.trim())) {
        if (currentChapter) {
          chapters.push(currentChapter)
        }
        chapterNumber++
        currentChapter = {
          number: chapterNumber,
          title: line.trim(),
          content: ''
        }
        isChapterTitle = true
        break
      }
    }
    
    if (!isChapterTitle && currentChapter) {
      currentChapter.content += line + '\n'
    }
  }
  
  if (currentChapter) {
    chapters.push(currentChapter)
  }
  
  if (chapters.length === 0) {
    chapters.push({
      number: 1,
      title: title || '第一章',
      content: content
    })
  }
  
  return chapters
}

export default router
