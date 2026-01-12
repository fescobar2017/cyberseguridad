"use client"

import { Shield, Network, FileCode, Bug } from "lucide-react"

interface StatsBarProps {
  target: string | null
  portsOpen: number
  portsTotal: number
  headersSecure: number
  headersTotal: number
  vulnCount: number
}

export function StatsBar({ target, portsOpen, portsTotal, headersSecure, headersTotal, vulnCount }: StatsBarProps) {
  if (!target) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-neon-green" />
          <span className="text-xs text-muted-foreground">Objetivo</span>
        </div>
        <p className="font-mono text-sm text-foreground truncate">{target}</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Network className="w-4 h-4 text-neon-green" />
          <span className="text-xs text-muted-foreground">Puertos Abiertos</span>
        </div>
        <p className="font-mono text-2xl font-bold text-neon-green">
          {portsOpen}
          <span className="text-muted-foreground text-sm">/{portsTotal}</span>
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileCode className="w-4 h-4 text-neon-green" />
          <span className="text-xs text-muted-foreground">Cabeceras Seguras</span>
        </div>
        <p className="font-mono text-2xl font-bold text-neon-green">
          {headersSecure}
          <span className="text-muted-foreground text-sm">/{headersTotal}</span>
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Bug className="w-4 h-4 text-neon-red" />
          <span className="text-xs text-muted-foreground">Vulnerabilidades</span>
        </div>
        <p className={`font-mono text-2xl font-bold ${vulnCount > 0 ? "text-neon-red" : "text-neon-green"}`}>
          {vulnCount}
        </p>
      </div>
    </div>
  )
}
