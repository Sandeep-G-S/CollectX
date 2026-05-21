import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cx_token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (token) {
      const decoded = decodeJwt(token)
      if (decoded) {
        setUser({ email: decoded.sub, role: decoded.role })
      } else {
        logout()
      }
    }
  }, [token])

  const login = (newToken) => {
    localStorage.setItem('cx_token', newToken)
    setToken(newToken)
    const decoded = decodeJwt(newToken)
    if (decoded) setUser({ email: decoded.sub, role: decoded.role })
  }

  const logout = () => {
    localStorage.removeItem('cx_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
