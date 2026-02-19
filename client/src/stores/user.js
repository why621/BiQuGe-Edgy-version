import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  if (token.value) {
    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]))
      user.value = {
        id: payload.userId,
        username: payload.username,
        role: payload.role
      }
    } catch (e) {
      token.value = ''
      localStorage.removeItem('token')
    }
  }

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setUser(userData, userToken) {
    user.value = userData
    token.value = userToken
    localStorage.setItem('token', userToken)
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    isLoggedIn,
    isAdmin,
    setUser,
    logout
  }
})
