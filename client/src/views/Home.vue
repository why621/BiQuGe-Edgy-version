<template>
  <div class="home-page">
    <div class="page-header">
      <h1 class="text-highlight">热门小说</h1>
      <p>发现精彩故事，开启阅读之旅</p>
    </div>
    
    <div class="novel-grid" v-if="novels.length > 0">
      <div 
        class="novel-card card-hover" 
        v-for="novel in novels" 
        :key="novel.id"
        @click="goToNovel(novel.id)"
      >
        <div class="novel-cover img-hover">
          <img v-if="novel.cover_url" :src="novel.cover_url" alt="封面" />
          <div v-else class="no-cover">
            <el-icon><Document /></el-icon>
          </div>
        </div>
        <div class="novel-info">
          <h3 class="novel-title">{{ novel.title }}</h3>
          <p class="novel-author">{{ novel.author_name || novel.author }}</p>
          <div class="novel-tags">
            <span class="tag tag-animate" v-if="novel.style">{{ novel.style }}</span>
            <span class="tag tag-animate" v-if="novel.genre">{{ novel.genre }}</span>
          </div>
          <p class="novel-desc">{{ novel.description || '暂无简介' }}</p>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-else-if="!loading">
      <el-icon :size="60"><Reading /></el-icon>
      <p>暂无小说，快来创作吧！</p>
    </div>
    
    <div class="loading-state" v-if="loading">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const novels = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    novels.value = await api.novels.getAll()
  } catch (error) {
    console.error('获取小说列表失败:', error)
  } finally {
    loading.value = false
  }
})

function goToNovel(id) {
  router.push(`/novel/${id}`)
}
</script>

<style scoped>
.home-page {
  padding: 20px 0;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 32px;
  color: #e94560;
  margin-bottom: 10px;
}

.page-header p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

.novel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
}

.novel-card {
  background: rgba(26, 26, 46, 0.8);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.novel-card:hover {
  transform: translateY(-5px);
  border-color: #e94560;
  box-shadow: 0 10px 30px rgba(233, 69, 96, 0.2);
}

.novel-cover {
  height: 180px;
  background: linear-gradient(135deg, #16213e 0%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
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

.novel-info {
  padding: 20px;
}

.novel-title {
  font-size: 18px;
  color: #fff;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.novel-author {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin-bottom: 10px;
}

.novel-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.tag {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.novel-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-state,
.loading-state {
  text-align: center;
  padding: 80px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-state .el-icon,
.loading-state .el-icon {
  margin-bottom: 20px;
  color: #e94560;
}
</style>
