<template>
  <div class="novel-detail-page">
    <div class="loading-state" v-if="loading">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <template v-else-if="novel">
      <div class="novel-header">
        <div class="novel-cover">
          <img v-if="novel.cover_url" :src="novel.cover_url" alt="封面" />
          <div v-else class="no-cover">
            <el-icon><Document /></el-icon>
          </div>
        </div>
        <div class="novel-meta">
          <h1>{{ novel.title }}</h1>
          <p class="author">作者：{{ novel.author_name || novel.author }}</p>
          <div class="tags">
            <span class="tag" v-if="novel.style">{{ getStyleName(novel.style) }}</span>
            <span class="tag" v-if="novel.genre">{{ getGenreName(novel.genre) }}</span>
          </div>
          <p class="description">{{ novel.description || '暂无简介' }}</p>
          <p class="source">来源：{{ novel.source === 'ai' ? 'AI创作' : (novel.source === 'upload' ? '本站上传' : '用户创作') }}</p>
        </div>
      </div>
      
      <div class="novel-content" v-if="novel.chapters && novel.chapters.length > 0">
        <div class="chapter-list">
          <h3>目录</h3>
          <div class="chapters">
            <div 
              class="chapter-item" 
              v-for="chapter in novel.chapters" 
              :key="chapter.id"
              :class="{ active: currentChapter === chapter.chapter_number }"
              @click="currentChapter = chapter.chapter_number"
            >
              {{ chapter.title }}
            </div>
          </div>
        </div>
        
        <div class="chapter-content">
          <h3>{{ currentChapterData?.title }}</h3>
          <div class="content-text">{{ currentChapterData?.content }}</div>
        </div>
      </div>
      
      <div class="novel-content" v-else>
        <h3>正文</h3>
        <div class="content-text">{{ novel.content }}</div>
      </div>
    </template>
    
    <div class="empty-state" v-else>
      <el-icon :size="60"><Warning /></el-icon>
      <p>小说不存在或已删除</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'

const route = useRoute()
const novel = ref(null)
const loading = ref(true)
const currentChapter = ref(1)
const keywords = ref({ styles: [], genres: [] })

const currentChapterData = computed(() => {
  if (!novel.value?.chapters) return null
  return novel.value.chapters.find(c => c.chapter_number === currentChapter.value)
})

onMounted(async () => {
  try {
    const [novelData, keywordsData] = await Promise.all([
      api.novels.getOne(route.params.id),
      api.ai.getKeywords()
    ])
    novel.value = novelData
    keywords.value = keywordsData
  } catch (error) {
    console.error('获取小说详情失败:', error)
  } finally {
    loading.value = false
  }
})

function getStyleName(id) {
  const style = keywords.value.styles.find(s => s.id === id)
  return style ? style.name : id
}

function getGenreName(id) {
  const genre = keywords.value.genres.find(g => g.id === id)
  return genre ? genre.name : id
}
</script>

<style scoped>
.novel-detail-page {
  padding: 20px 0;
}

.novel-header {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  padding: 30px;
  background: rgba(26, 26, 46, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.novel-cover {
  width: 200px;
  height: 280px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #16213e 0%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.novel-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-cover {
  color: rgba(255, 255, 255, 0.3);
  font-size: 60px;
}

.novel-meta {
  flex: 1;
}

.novel-meta h1 {
  font-size: 28px;
  color: #fff;
  margin-bottom: 15px;
}

.author {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  margin-bottom: 15px;
}

.tags {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.tag {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 14px;
}

.description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  line-height: 1.8;
  margin-bottom: 15px;
}

.source {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

.novel-content {
  background: rgba(26, 26, 46, 0.8);
  border-radius: 12px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.novel-content h3 {
  color: #e94560;
  font-size: 20px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.content-text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 16px;
  line-height: 2;
  white-space: pre-wrap;
}

.chapter-list {
  margin-bottom: 30px;
}

.chapters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chapter-item {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  color: rgba(255, 255, 255, 0.7);
}

.chapter-item:hover {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
}

.chapter-item.active {
  background: #e94560;
  color: #fff;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.loading-state .el-icon,
.empty-state .el-icon {
  margin-bottom: 20px;
  color: #e94560;
}
</style>
