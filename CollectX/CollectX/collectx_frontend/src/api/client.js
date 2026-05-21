import axios from 'axios'

const client = axios.create({
  baseURL: '',          // vite proxy handles routing to :8888
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('cx_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cx_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
