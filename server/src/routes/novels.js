import { Router } from 'express'
import db from '../database/init.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

router.get('/', (req, res) => {
  try {
    const novels = db.prepare(`
      SELECT n.*, u.username as author_name 
      FROM novels n 
      LEFT JOIN users u ON n.user_id = u.id 
      WHERE n.status = 'published'
      ORDER BY n.created_at DESC
    `).all()
    res.json(novels)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const novel = db.prepare(`
      SELECT n.*, u.username as author_name 
      FROM novels n 
      LEFT JOIN users u ON n.user_id = u.id 
      WHERE n.id = ?
    `).get(req.params.id)
    
    if (!novel) {
      return res.status(404).json({ error: '小说不存在' })
    }

    const chapters = db.prepare('SELECT * FROM chapters WHERE novel_id = ? ORDER BY chapter_number').all(req.params.id)
    novel.chapters = chapters
    
    res.json(novel)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', verifyToken, (req, res) => {
  try {
    const { title, author, description, style, genre, keywords, cover_url, content, source, chapters } = req.body
    
    const result = db.prepare(`
      INSERT INTO novels (title, author, description, style, genre, keywords, cover_url, content, source, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, author, description, style, genre, keywords, cover_url, content, source || 'user', req.userId)

    const novelId = result.lastInsertRowid

    if (chapters && chapters.length > 0) {
      const insertChapter = db.prepare('INSERT INTO chapters (novel_id, chapter_number, title, content) VALUES (?, ?, ?, ?)')
      chapters.forEach((chapter, index) => {
        insertChapter.run(novelId, index + 1, chapter.title, chapter.content)
      })
    }

    res.json({ success: true, novelId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', verifyToken, (req, res) => {
  try {
    const { title, author, description, style, genre, keywords, cover_url, content } = req.body
    
    db.prepare(`
      UPDATE novels 
      SET title = ?, author = ?, description = ?, style = ?, genre = ?, keywords = ?, cover_url = ?, content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(title, author, description, style, genre, keywords, cover_url, content, req.params.id, req.userId)
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', verifyToken, (req, res) => {
  try {
    const novel = db.prepare('SELECT * FROM novels WHERE id = ?').get(req.params.id)
    
    if (!novel) {
      return res.status(404).json({ error: '小说不存在' })
    }

    if (novel.user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: '无权删除此小说' })
    }

    db.prepare('DELETE FROM novels WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/user/my', verifyToken, (req, res) => {
  try {
    const novels = db.prepare('SELECT * FROM novels WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
    res.json(novels)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
