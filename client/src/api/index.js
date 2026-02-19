import axios from 'axios'
import { ElMessage } from 'element-plus'

const instance = axios.create({
  baseURL: '/api',
  timeout: 60000
})

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export default {
  auth: {
    login: (data) => instance.post('/auth/login', data),
    register: (data) => instance.post('/auth/register', data)
  },
  
  novels: {
    getAll: () => instance.get('/novels'),
    getOne: (id) => instance.get(`/novels/${id}`),
    create: (data) => instance.post('/novels', data),
    update: (id, data) => instance.put(`/novels/${id}`, data),
    delete: (id) => instance.delete(`/novels/${id}`),
    getMy: () => instance.get('/novels/user/my')
  },
  
  ai: {
    getKeywords: () => instance.get('/ai/keywords'),
    create: (data) => instance.post('/ai/create', data),
    continue: (data) => instance.post('/ai/continue', data)
  },
  
  upload: {
    cover: (file) => {
      const formData = new FormData()
      formData.append('cover', file)
      return instance.post('/upload/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    novel: (file) => {
      const formData = new FormData()
      formData.append('novel', file)
      return instance.post('/upload/novel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    parse: (data) => instance.post('/upload/parse', data)
  }
}
