import { Router } from 'express'
import { verifyToken } from '../middleware/auth.js'
import db from '../database/init.js'
import config from '../config.js'

const NOVEL_STYLES = [
  { id: 'realistic', name: '写实', description: '贴近现实生活的描写风格' },
  { id: 'fantasy', name: '魔幻', description: '充满奇幻元素的想象风格' },
  { id: 'romantic', name: '浪漫', description: '情感丰富、诗意盎然的风格' },
  { id: 'suspense', name: '悬疑', description: '充满悬念和推理的风格' },
  { id: 'humorous', name: '幽默', description: '轻松诙谐的喜剧风格' },
  { id: 'tragic', name: '悲剧', description: '深沉悲伤的戏剧风格' },
  { id: 'wuxia', name: '武侠', description: '传统武侠小说风格' },
  { id: 'scifi', name: '科幻', description: '未来科技与太空探索风格' }
]

const NOVEL_GENRES = [
  { id: 'war', name: '战争', description: '描写战争与军事题材' },
  { id: 'love', name: '爱情', description: '讲述爱情故事' },
  { id: 'adventure', name: '冒险', description: '充满冒险与探索的故事' },
  { id: 'mystery', name: '推理', description: '解谜与侦探故事' },
  { id: 'history', name: '历史', description: '基于历史背景的故事' },
  { id: 'urban', name: '都市', description: '现代都市生活故事' },
  { id: 'cultivation', name: '修仙', description: '修真与仙侠故事' },
  { id: 'horror', name: '恐怖', description: '惊悚恐怖故事' }
]

const router = Router()

router.get('/keywords', (req, res) => {
  res.json({
    styles: NOVEL_STYLES,
    genres: NOVEL_GENRES
  })
})

async function callVolcanoAPI(messages, maxTokens = 4096) {
  const response = await fetch(config.volcano.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.volcano.apiKey}`
    },
    body: JSON.stringify({
      model: config.volcano.endpointId,
      messages,
      max_tokens: maxTokens,
      temperature: 0.8
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('火山引擎API错误:', errorText)
    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.error?.code === 'InvalidEndpointOrModel.NotFound') {
        throw new Error('模型端点不存在，请在火山引擎控制台创建推理接入点并更新 server/src/config.js 中的 endpointId')
      }
    } catch (e) {
      if (e.message.includes('模型端点')) throw e
    }
    throw new Error('AI服务调用失败: ' + response.status)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

router.post('/create', verifyToken, async (req, res) => {
  try {
    const { prompt, style, genre, keywords, length = 'short' } = req.body
    
    if (!prompt) {
      return res.status(400).json({ error: '请提供创作提示' })
    }

    const styleInfo = NOVEL_STYLES.find(s => s.id === style)
    const genreInfo = NOVEL_GENRES.find(g => g.id === genre)

    const lengthGuide = {
      short: '800-1500字',
      medium: '2000-3500字',
      long: '4000-6000字'
    }

    const systemPrompt = `你是一位专业的小说作家。请根据用户的要求创作一篇短篇小说。

要求：
1. 写作风格：${styleInfo ? styleInfo.name : '自由发挥'} - ${styleInfo ? styleInfo.description : ''}
2. 小说题材：${genreInfo ? genreInfo.name : '自由发挥'} - ${genreInfo ? genreInfo.description : ''}
3. 关键词：${keywords || '无特定要求'}
4. 字数要求：${lengthGuide[length] || '800-1500字'}

请创作一个完整的故事，包含：
- 引人入胜的开头
- 发展的情节
- 合理的结局

直接输出小说内容，不要添加任何解释或说明。`

    const content = await callVolcanoAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], 4096)

    db.prepare(`
      INSERT INTO ai_creations (user_id, prompt, style, genre, keywords, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.userId, prompt, style, genre, keywords, content)

    res.json({ 
      success: true, 
      content,
      style: styleInfo,
      genre: genreInfo
    })
  } catch (error) {
    console.error('AI创作错误:', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/continue', verifyToken, async (req, res) => {
  try {
    const { content, prompt } = req.body
    
    if (!content) {
      return res.status(400).json({ error: '请提供已有内容' })
    }

    const systemPrompt = `你是一位专业的小说作家。请根据已有的小说内容，继续创作后续情节。

要求：
1. 保持与已有内容一致的风格和语气
2. 情节发展要自然流畅
3. 继续创作约500-800字

直接输出续写内容，不要添加任何解释或说明。`

    const newContent = await callVolcanoAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `已有内容：\n${content}\n\n${prompt ? '续写要求：' + prompt : '请继续创作'}` }
    ], 2048)

    res.json({ success: true, content: newContent })
  } catch (error) {
    console.error('AI续写错误:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
