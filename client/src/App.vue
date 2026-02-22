<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <router-link to="/" class="logo">
          <el-icon><Reading /></el-icon>
          <span>笔趣阁黑化版</span>
        </router-link>
        <nav class="nav-menu">
          <router-link to="/" class="nav-item nav-animate">首页</router-link>
          <router-link to="/create" class="nav-item nav-animate">AI创作</router-link>
          <router-link to="/my-novels" class="nav-item nav-animate" v-if="userStore.isLoggedIn">我的作品</router-link>
          <router-link to="/admin" class="nav-item nav-animate" v-if="userStore.isAdmin">管理后台</router-link>
        </nav>
        <div class="user-area">
          <template v-if="userStore.isLoggedIn">
            <span class="username">{{ userStore.user?.username }}</span>
            <el-button type="danger" size="small" @click="logout" class="btn-animate btn-ripple">退出</el-button>
          </template>
          <template v-else>
            <el-button type="primary" size="small" @click="showLogin = true" class="btn-animate btn-ripple">登录</el-button>
            <el-button size="small" @click="showRegister = true" class="btn-animate btn-ripple">注册</el-button>
          </template>
        </div>
      </div>
    </header>
    
    <main class="app-main">
      <router-view />
    </main>

    <el-dialog v-model="showLogin" title="登录" width="400px">
      <el-form :model="loginForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" @keyup.enter="login" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLogin = false">取消</el-button>
        <el-button type="primary" @click="login">登录</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRegister" title="注册" width="400px">
      <el-form :model="registerForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" @keyup.enter="register" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegister = false">取消</el-button>
        <el-button type="primary" @click="register">注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from './stores/user'
import api from './api'

const router = useRouter()
const userStore = useUserStore()

const showLogin = ref(false)
const showRegister = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

async function login() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  
  try {
    const res = await api.auth.login(loginForm)
    if (res.success) {
      userStore.setUser(res.user, res.token)
      showLogin.value = false
      ElMessage.success('登录成功')
      loginForm.username = ''
      loginForm.password = ''
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '登录失败')
  }
}

async function register() {
  if (!registerForm.username || !registerForm.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  if (registerForm.password !== registerForm.confirmPassword) {
    ElMessage.warning('两次密码输入不一致')
    return
  }
  
  try {
    const res = await api.auth.register({
      username: registerForm.username,
      password: registerForm.password
    })
    if (res.success) {
      showRegister.value = false
      ElMessage.success('注册成功，请登录')
      registerForm.username = ''
      registerForm.password = ''
      registerForm.confirmPassword = ''
      showLogin.value = true
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '注册失败')
  }
}

function logout() {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/')
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: rgba(26, 26, 46, 0.95);
  border-bottom: 1px solid rgba(233, 69, 96, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: bold;
  color: #e94560;
  text-decoration: none;
}

.logo .el-icon {
  font-size: 28px;
}

.nav-menu {
  display: flex;
  gap: 30px;
}

.nav-item {
  color: #e0e0e0;
  text-decoration: none;
  font-size: 15px;
  transition: color 0.3s;
  position: relative;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: #e94560;
}

.nav-item.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  right: 0;
  height: 2px;
  background: #e94560;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 15px;
}

.username {
  color: #e94560;
  font-weight: 500;
}

.app-main {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
}
</style>
