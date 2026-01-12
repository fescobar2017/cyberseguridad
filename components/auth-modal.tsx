"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerUser, loginUser } from "@/lib/auth-storage"
import { Shield, Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react"

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call

    if (mode === "login") {
      const result = loginUser(email, password)
      if (result.success) {
        onSuccess()
        onClose()
        resetForm()
      } else {
        setError(result.error || "Error al iniciar sesión")
      }
    } else {
      const result = registerUser(email, password, name)
      if (result.success) {
        onSuccess()
        onClose()
        resetForm()
      } else {
        setError(result.error || "Error al registrar")
      }
    }

    setLoading(false)
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setName("")
    setError("")
  }

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login")
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <div className="relative">
              <Shield className="w-6 h-6 text-neon-green" />
              <div className="absolute inset-0 bg-neon-green/20 blur-md" />
            </div>
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-muted-foreground">
                Nombre
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10 bg-secondary border-border focus:border-neon-green focus:ring-neon-green/20"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-secondary border-border focus:border-neon-green focus:ring-neon-green/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-muted-foreground">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pl-10 bg-secondary border-border focus:border-neon-green focus:ring-neon-green/20"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-alert-red bg-alert-red/10 px-3 py-2 rounded-md">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-neon-green text-primary-foreground hover:bg-neon-green/90 transition-all hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-muted-foreground hover:text-neon-green transition-colors"
            >
              {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
