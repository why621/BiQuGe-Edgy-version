<template>
  <div class="admin-page">
    <div class="page-header">
      <h1>管理后台</h1>
      <p>开发者小说上传与管理</p>
    </div>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="上传小说" name="upload">
        <div class="upload-section">
          <el-form :model="uploadForm" label-width="100px">
            <el-form-item label="小说文件">
              <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :limit="1"
                accept=".txt,.md"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
              >
                <template #trigger>
                  <el-button type="primary">选择文件</el-button>
                </template>
                <template #tip>
                  <div class="el-upload__tip">支持 txt、md 格式，文件大小不超过 50MB</div>
                </template>
              </el-upload>
            </el-form-item>
            
            <el-form-item label="小说标题">
              <el-input v-model="uploadForm.title" placeholder="请输入小说标题" />
            </el-form-item>
            
            <el-form-item label="作者">
              <el-input v-model="uploadForm.author" placeholder="请输入作者名" />
            </el-form-item>
            
            <el-form-item label="简介">
              <el-input 
                v-model="uploadForm.description" 
                type="textarea" 
                :rows="3"
                placeholder="请输入小说简介"
              />
            </el-form-item>
            
            <el-form-item label="写作风格">
              <el-select v-model="uploadForm.style" placeholder="选择风格" clearable>
                <el-option 
                  v-for="style in keywords.styles" 
                  :key="style.id" 
                  :label="style.name" 
                  :value="style.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="小说题材">
              <el-select v-model="uploadForm.genre" placeholder="选择题材" clearable>
                <el-option 
                  v-for="genre in keywords.genres" 
                  :key="genre.id" 
                  :label="genre.name" 
                  :value="genre.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="小说封面">
              <el-upload
                class="cover-uploader"
                :show-file-list="false"
                :before-upload="beforeCoverUpload"
                :http-request="uploadCoverHandler"
              >
                <img v-if="uploadForm.cover_url" :src="uploadForm.cover_url" class="cover-preview" />
                <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            
            <el-form-item label="内容预览" v-if="uploadForm.content">
              <div class="content-preview">
                <div class="preview-header">
                  <span>共 {{ chapters.length }} 章</span>
                  <el-button size="small" @click="parseContent">重新解析</el-button>
                </div>
                <div class="chapter-list">
                  <div class="chapter-item" v-for="(chapter, index) in chapters" :key="index">
                    <span class="chapter-num">第{{ chapter.number }}章</span>
                    <span class="chapter-title">{{ chapter.title }}</span>
                  </div>
                </div>
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                :loading="uploading"
                :disabled="!uploadForm.content || !uploadForm.title"
                @click="submitUpload"
              >
                发布小说
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
      
      <el-tab-pane label="小说管理" name="manage">
        <div class="manage-section">
          <el-table :data="allNovels" style="width: 100%" v-loading="loadingNovels">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="title" label="标题" min-width="150" />
            <el-table-column prop="author" label="作者" width="120" />
            <el-table-column prop="style" label="风格" width="100" />
            <el-table-column prop="genre" label="题材" width="100" />
            <el-table-column prop="source" label="来源" width="100">
              <template #default="{ row }">
                <el-tag :type="getSourceType(row.source)">
                  {{ getSourceLabel(row.source) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="150">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" link type="primary" @click="viewNovel(row.id)">查看</el-button>
                <el-button size="small" link type="danger" @click="deleteNovel(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const router = useRouter()
const activeTab = ref('upload')
const keywords = ref({ styles: [], genres: [] })
const allNovels = ref([])
const loadingNovels = ref(false)
const uploading = ref(false)
const chapters = ref([])

const uploadForm = reactive({
  title: '',
  author: '',
  description: '',
  style: '',
  genre: '',
  cover_url: '',
  content: '',
  file: null
})

onMounted(async () => {
  try {
    keywords.value = await api.ai.getKeywords()
    await loadAllNovels()
  } catch (error) {
    console.error('初始化失败:', error)
  }
})

async function loadAllNovels() {
  loadingNovels.value = true
  try {
    allNovels.value = await api.novels.getAll()
  } catch (error) {
    console.error('获取小说列表失败:', error)
  } finally {
    loadingNovels.value = false
  }
}

function handleFileChange(file) {
  uploadForm.file = file.raw
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadForm.content = e.target.result
    parseContent()
  }
  reader.readAsText(file.raw)
}

function handleFileRemove() {
  uploadForm.file = null
  uploadForm.content = ''
  chapters.value = []
}

async function parseContent() {
  if (!uploadForm.content) return
  
  try {
    const res = await api.upload.parse({
      content: uploadForm.content,
      title: uploadForm.title
    })
    if (res.success) {
      chapters.value = res.chapters
      if (!uploadForm.title && res.chapters.length > 0) {
        const firstTitle = res.chapters[0].title
        uploadForm.title = firstTitle.replace(/^第[一二三四五六七八九十百千万零\d]+[章节回]\s*/, '')
      }
    }
  } catch (error) {
    console.error('解析内容失败:', error)
  }
}

function beforeCoverUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

async function uploadCoverHandler(options) {
  try {
    const res = await api.upload.cover(options.file)
    if (res.success) {
      uploadForm.cover_url = res.url
      ElMessage.success('封面上传成功')
    }
  } catch (error) {
    ElMessage.error('封面上传失败')
  }
}

async function submitUpload() {
  if (!uploadForm.content || !uploadForm.title) {
    ElMessage.warning('请填写必要信息')
    return
  }
  
  uploading.value = true
  try {
    const res = await api.novels.create({
      title: uploadForm.title,
      author: uploadForm.author || '佚名',
      description: uploadForm.description,
      style: uploadForm.style,
      genre: uploadForm.genre,
      cover_url: uploadForm.cover_url,
      content: uploadForm.content,
      source: 'upload',
      chapters: chapters.value
    })
    
    if (res.success) {
      ElMessage.success('小说发布成功！')
      resetForm()
      await loadAllNovels()
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '发布失败')
  } finally {
    uploading.value = false
  }
}

function resetForm() {
  uploadForm.title = ''
  uploadForm.author = ''
  uploadForm.description = ''
  uploadForm.style = ''
  uploadForm.genre = ''
  uploadForm.cover_url = ''
  uploadForm.content = ''
  uploadForm.file = null
  chapters.value = []
}

function viewNovel(id) {
  router.push(`/novel/${id}`)
}

async function deleteNovel(id) {
  try {
    await ElMessageBox.confirm('确定要删除这部小说吗？', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await api.novels.delete(id)
    ElMessage.success('删除成功')
    allNovels.value = allNovels.value.filter(n => n.id !== id)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '删除失败')
    }
  }
}

function getSourceType(source) {
  const types = {
    ai: 'success',
    upload: 'primary',
    user: 'warning'
  }
  return types[source] || 'info'
}

function getSourceLabel(source) {
  const labels = {
    ai: 'AI创作',
    upload: '本站上传',
    user: '用户创作'
  }
  return labels[source] || source
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.admin-page {
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

.upload-section,
.manage-section {
  background: rgba(26, 26, 46, 0.8);
  border-radius: 12px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.content-preview {
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chapter-item {
  display: flex;
  gap: 15px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
}

.chapter-num {
  color: #e94560;
  font-weight: 500;
}

.chapter-title {
  color: rgba(255, 255, 255, 0.8);
}

.cover-uploader {
  width: 120px;
  height: 160px;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}

.cover-uploader:hover {
  border-color: #e94560;
}

.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-uploader-icon {
  font-size: 30px;
  color: rgba(255, 255, 255, 0.3);
}

:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.05);
  --el-table-row-hover-bg-color: rgba(233, 69, 96, 0.1);
  --el-table-border-color: rgba(255, 255, 255, 0.1);
  --el-table-text-color: rgba(255, 255, 255, 0.8);
  --el-table-header-text-color: #e94560;
}
</style>
