// Sistema de autenticación con localStorage
// Fácilmente migrable a PostgreSQL/Supabase

export interface User {
  id: string
  email: string
  password: string // En producción, usar hash con bcrypt
  name: string
  createdAt: number
}

export interface AuthSession {
  userId: string
  email: string
  name: string
  expiresAt: number
}

const USERS_KEY = "cyberscan_users"
const SESSION_KEY = "cyberscan_session"
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 horas

export function registerUser(email: string, password: string, name: string): { success: boolean; error?: string } {
  const users = getUsers()

  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: "El email ya está registrado" }
  }

  if (password.length < 6) {
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres" }
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    password, // En producción: await bcrypt.hash(password, 10)
    name,
    createdAt: Date.now(),
  }

  try {
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]))
    createSession(newUser)
    return { success: true }
  } catch {
    return { success: false, error: "Error al registrar usuario" }
  }
}

export function loginUser(email: string, password: string): { success: boolean; error?: string } {
  const users = getUsers()
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

  if (!user) {
    return { success: false, error: "Email no encontrado" }
  }

  // En producción: await bcrypt.compare(password, user.password)
  if (user.password !== password) {
    return { success: false, error: "Contraseña incorrecta" }
  }

  createSession(user)
  return { success: true }
}

export function logoutUser(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    console.error("Error al cerrar sesión")
  }
}

export function getCurrentSession(): AuthSession | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null

    const session: AuthSession = JSON.parse(stored)

    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }

    return session
  } catch {
    return null
  }
}

function createSession(user: User): void {
  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    expiresAt: Date.now() + SESSION_DURATION,
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function getUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}
