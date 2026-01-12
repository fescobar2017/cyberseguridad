"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Shield, Loader2, Zap, Clock, Target, Ghost } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ScanInputProps {
  onScan: (target: string, scanType: "quick" | "common" | "full" | "stealth") => void
  isScanning: boolean
}

export function ScanInput({ onScan, isScanning }: ScanInputProps) {
  const [target, setTarget] = useState("")
  const [scanType, setScanType] = useState<"quick" | "common" | "full" | "stealth">("quick")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (target.trim()) {
      onScan(target.trim(), scanType)
    }
  }

  const scanTypes = [
    { value: "quick", label: "Rápido", icon: Zap, description: "Top 100 puertos (~30s)" },
    { value: "common", label: "Común", icon: Target, description: "Top 1000 puertos (~2min)" },
    { value: "full", label: "Completo", icon: Clock, description: "Todos los puertos (~10min)" },
    { value: "stealth", label: "Sigiloso", icon: Ghost, description: "SYN scan (requiere root)" },
  ]

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-neon-green/5 blur-xl rounded-3xl" />
      <div className="relative bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-neon-green/10 rounded-lg">
            <Shield className="w-6 h-6 text-neon-green" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Análisis de Seguridad</h2>
            <p className="text-sm text-muted-foreground">Ingresa una IP o URL para escanear con Nmap</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="192.168.1.1 o ejemplo.com"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-neon-green focus:ring-neon-green/20 h-12 font-mono"
              disabled={isScanning}
            />
          </div>

          <Select
            value={scanType}
            onValueChange={(value: "quick" | "common" | "full" | "stealth") => setScanType(value)}
            disabled={isScanning}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-12 bg-secondary border-border text-foreground">
              <SelectValue placeholder="Tipo de escaneo" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {scanTypes.map((type) => (
                <SelectItem
                  key={type.value}
                  value={type.value}
                  className="text-foreground focus:bg-neon-green/10 focus:text-neon-green"
                >
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="submit"
            disabled={isScanning || !target.trim()}
            className="h-12 px-6 bg-neon-green text-primary-foreground hover:bg-neon-green/90 font-semibold transition-all hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Escaneando...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Iniciar Escaneo
              </>
            )}
          </Button>
        </form>

        <p className="mt-3 text-xs text-muted-foreground">
          {scanTypes.find((t) => t.value === scanType)?.description}
          {" • "}
          <span className="text-neon-green">Escaneo Nmap real</span>
        </p>
      </div>
    </div>
  )
}
