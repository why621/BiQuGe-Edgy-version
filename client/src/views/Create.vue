<template>
  <div class="create-page">
    <div class="page-header">
      <h1>AI小说创作</h1>
      <p>让AI帮你创作精彩的短篇小说</p>
    </div>
    
    <div class="create-container">
      <div class="settings-panel">
        <h3>创作设置</h3>
        
        <el-form label-position="top">
          <el-form-item label="写作风格">
            <el-select v-model="settings.style" placeholder="选择风格" clearable>
              <el-option 
                v-for="style in keywords.styles" 
                :key="style.id" 
                :label="style.name" 
                :value="style.id"
              >
                <div class="option-content">
                  <span class="option-name">{{ style.name }}</span>
                  <span class="option-desc">{{ style.description }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="小说题材">
            <el-select v-model="settings.genre" placeholder="选择题材" clearable>
              <el-option 
                v-for="genre in keywords.genres" 
                :key="genre.id" 
                :label="genre.name" 
                :value="genre.id"
              >
                <div class="option-content">
                  <span class="option-name">{{ genre.name }}</span>
                  <span class="option-desc">{{ genre.description }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="小说长度">
            <el-radio-group v-model="settings.length">
              <el-radio value="short">短篇 (800-1500字)</el-radio>
              <el-radio value="medium">中篇 (2000-3500字)</el-radio>
              <el-radio value="long">长篇 (4000-6000字)</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="关键词/主题">
            <el-input 
              v-model="settings.keywords" 
              placeholder="输入关键词，用逗号分隔"
            />
          </el-form-item>
          
          <el-form-item label="创作提示">
            <el-input 
              v-model="settings.prompt" 
              type="textarea" 
              :rows="4"
              placeholder="描述你想要创作的故事内容..."
            />
          </el-form-item>
          
          <el-button 
            type="primary" 
            size="large" 
            :loading="creating"
            @click="createNovel"
            :disabled="!settings.prompt"
          >
            <el-icon><MagicStick /></el-icon>
            开始创作
          </el-button>
        </el-form>
      </div>
      
      <div class="result-panel">
        <div class="result-header">
          <h3>创作结果</h3>
          <div class="result-actions" v-if="generatedContent">
            <el-button size="small" @click="continueWriting" :loading="continuing">
              <el-icon><Edit /></el-icon>
              续写
            </el-button>
            <el-button size="small" type="primary" @click="showPublishDialog = true">
              <el-icon><Upload /></el-icon>
              发布
            </el-button>
          </div>
        </div>
        
        <div class="result-content" v-if="generatedContent">
          <div class="content-text">{{ generatedContent }}</div>
        </div>
        
        <div class="empty-result" v-else>
          <el-icon :size="60"><EditPen /></el-icon>
          <p>创作内容将在这里显示</p>
        </div>
      </div>
    </div>
    
    <el-dialog v-model="showPublishDialog" title="发布小说" width="500px">
      <el-form :model="publishForm" label-width="80px">
        <el-form-item label="小说标题">
          <el-input v-model="publishForm.title" placeholder="请输入小说标题" />
        </el-form-item>
        <el-form-item label="作者笔名">
          <el-input v-model="publishForm.author" placeholder="请输入作者笔名" />
        </el-form-item>
        <el-form-item label="小说简介">
          <el-input 
            v-model="publishForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入小说简介"
          />
        </el-form-item>
        <el-form-item label="小说封面">
          <el-upload
            class="cover-uploader"
            :show-file-list="false"
            :before-upload="beforeCoverUpload"
            :http-request="uploadCover"
          >
            <img v-if="publishForm.cover_url" :src="publishForm.cover_url" class="cover-preview" />
            <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPublishDialog = false">取消</el-button>
        <el-button type="primary" @click="publishNovel" :loading="publishing">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const keywords = ref({ styles: [], genres: [] })
const settings = reactive({
  style: '',
  genre: '',
  length: 'short',
  keywords: '',
  prompt: ''
})

const creating = ref(false)
const continuing = ref(false)
const generatedContent = ref('')

const showPublishDialog = ref(false)
const publishing = ref(false)
const publishForm = reactive({
  title: '',
  author: '',
  description: '',
  cover_url: ''
})

onMounted(async () => {
  try {
    keywords.value = await api.ai.getKeywords()
  } catch (error) {
    console.error('获取关键词失败:', error)
  }
})

async function createNovel() {
  if (!settings.prompt) {
    ElMessage.warning('请输入创作提示')
    return
  }
  
  creating.value = true
  try {
    const res = await api.ai.create(settings)
    if (res.success) {
      generatedContent.value = res.content
      ElMessage.success('创作完成！')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '创作失败')
  } finally {
    creating.value = false
  }
}

async function continueWriting() {
  continuing.value = true
  try {
    const res = await api.ai.continue({ content: generatedContent.value })
    if (res.success) {
      generatedContent.value += '\n\n' + res.content
      ElMessage.success('续写完成！')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '续写失败')
  } finally {
    continuing.value = false
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

async function uploadCover(options) {
  try {
    const res = await api.upload.cover(options.file)
    if (res.success) {
      publishForm.cover_url = res.url
      ElMessage.success('封面上传成功')
    }
  } catch (error) {
    ElMessage.error('封面上传失败')
  }
}

async function publishNovel() {
  if (!publishForm.title) {
    ElMessage.warning('请输入小说标题')
    return
  }
  
  publishing.value = true
  try {
    const res = await api.novels.create({
      title: publishForm.title,
      author: publishForm.author || userStore.user?.username || '匿名',
      description: publishForm.description,
      style: settings.style,
      genre: settings.genre,
      keywords: settings.keywords,
      cover_url: publishForm.cover_url,
      content: generatedContent.value,
      source: 'ai'
    })
    
    if (res.success) {
      ElMessage.success('发布成功！')
      showPublishDialog.value = false
      router.push(`/novel/${res.novelId}`)
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '发布失败')
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
.create-page {
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

.create-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 30px;
}

.settings-panel,
.result-panel {
  background: rgba(26, 26, 46, 0.8);
  border-radius: 12px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-panel h3,
.result-panel h3 {
  color: #e94560;
  font-size: 18px;
  margin-bottom: 20px;
}

.option-content {
  display: flex;
  flex-direction: column;
}

.option-name {
  font-weight: 500;
}

.option-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.result-header h3 {
  margin-bottom: 0;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.result-content {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.content-text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 16px;
  line-height: 2;
  white-space: pre-wrap;
}

.empty-result {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
}

.empty-result .el-icon {
  margin-bottom: 15px;
}

.cover-uploader {
  width: 150px;
  height: 200px;
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
  font-size: 40px;
  color: rgba(255, 255, 255, 0.3);
}
</style>
