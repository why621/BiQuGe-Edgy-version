<template>
  <div class="my-novels-page">
    <div class="page-header">
      <h1>我的作品</h1>
      <p>管理你创作的所有小说</p>
    </div>
    
    <div class="novel-list" v-if="novels.length > 0">
      <div class="novel-item" v-for="novel in novels" :key="novel.id">
        <div class="novel-cover">
          <img v-if="novel.cover_url" :src="novel.cover_url" alt="封面" />
          <div v-else class="no-cover">
            <el-icon><Document /></el-icon>
          </div>
        </div>
        <div class="novel-info">
          <h3>{{ novel.title }}</h3>
          <p class="meta">
            <span>{{ novel.author }}</span>
            <span class="divider">|</span>
            <span>{{ novel.style || '未设置风格' }}</span>
            <span class="divider">|</span>
            <span>{{ novel.genre || '未设置题材' }}</span>
          </p>
          <p class="time">创建于 {{ formatDate(novel.created_at) }}</p>
          <p class="description">{{ novel.description || '暂无简介' }}</p>
        </div>
        <div class="novel-actions">
          <el-button size="small" @click="viewNovel(novel.id)">查看</el-button>
          <el-button size="small" type="danger" @click="deleteNovel(novel.id)">删除</el-button>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-else-if="!loading">
      <el-icon :size="60"><Document /></el-icon>
      <p>你还没有创作任何小说</p>
      <el-button type="primary" @click="$router.push('/create')">开始创作</el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const router = useRouter()
const novels = ref([])
const loading = ref(true)

onMounted(async () => {
  await loadNovels()
})

async function loadNovels() {
  loading.value = true
  try {
    novels.value = await api.novels.getMy()
  } catch (error) {
    console.error('获取我的小说失败:', error)
  } finally {
    loading.value = false
  }
}

function viewNovel(id) {
  router.push(`/novel/${id}`)
}

async function deleteNovel(id) {
  try {
    await ElMessageBox.confirm('确定要删除这部小说吗？删除后无法恢复。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await api.novels.delete(id)
    ElMessage.success('删除成功')
    novels.value = novels.value.filter(n => n.id !== id)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '删除失败')
    }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.my-novels-page {
  padding: 20px 0;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #e94560;
  margin-bottom: 10px;
}

.page-header p {
  color: rgba(255, 255, 255, 0.6);
}

.novel-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.novel-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: rgba(26, 26, 46, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.novel-item:hover {
  border-color: #e94560;
}

.novel-cover {
  width: 100px;
  height: 140px;
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
  font-size: 40px;
}

.novel-info {
  flex: 1;
}

.novel-info h3 {
  font-size: 18px;
  color: #fff;
  margin-bottom: 10px;
}

.meta {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin-bottom: 8px;
}

.divider {
  margin: 0 10px;
  color: rgba(255, 255, 255, 0.3);
}

.time {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  margin-bottom: 10px;
}

.description {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.novel-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
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

.empty-state .el-button {
  margin-top: 20px;
}
</style>
