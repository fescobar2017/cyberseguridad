"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bug, AlertOctagon, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Vulnerability {
  id: string
  title: string
  severity: "critical" | "high" | "medium" | "low"
  description: string
  cve?: string
  solution?: string
}

interface VulnerabilitiesProps {
  vulnerabilities: Vulnerability[]
  isScanning: boolean
}

export function Vulnerabilities({ vulnerabilities, isScanning }: VulnerabilitiesProps) {
  const getSeverityConfig = (severity: Vulnerability["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          icon: <AlertOctagon className="w-4 h-4" />,
          color: "text-neon-red",
          bg: "bg-neon-red/10",
          border: "border-neon-red/30",
          badge: "bg-neon-red text-white",
          label: "Crítico",
        }
      case "high":
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: "text-orange-500",
          bg: "bg-orange-500/10",
          border: "border-orange-500/30",
          badge: "bg-orange-500 text-white",
          label: "Alto",
        }
      case "medium":
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: "text-neon-yellow",
          bg: "bg-neon-yellow/10",
          border: "border-neon-yellow/30",
          badge: "bg-neon-yellow text-black",
          label: "Medio",
        }
      case "low":
        return {
          icon: <Info className="w-4 h-4" />,
          color: "text-blue-400",
          bg: "bg-blue-400/10",
          border: "border-blue-400/30",
          badge: "bg-blue-400 text-white",
          label: "Bajo",
        }
    }
  }

  const sortedVulnerabilities = [...vulnerabilities].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    return order[a.severity] - order[b.severity]
  })

  const criticalCount = vulnerabilities.filter((v) => v.severity === "critical").length
  const highCount = vulnerabilities.filter((v) => v.severity === "high").length

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <div className="p-2 bg-neon-red/10 rounded-lg">
              <Bug className="w-5 h-5 text-neon-red" />
            </div>
            Vulnerabilidades Detectadas
          </CardTitle>
          {vulnerabilities.length > 0 && (
            <div className="flex gap-2">
              {criticalCount > 0 && <Badge className="bg-neon-red text-white">{criticalCount} Críticas</Badge>}
              {highCount > 0 && <Badge className="bg-orange-500 text-white">{highCount} Altas</Badge>}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isScanning ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              <Bug className="w-12 h-12 text-neon-red animate-pulse" />
              <div className="absolute inset-0 bg-neon-red/20 blur-xl animate-pulse" />
            </div>
            <p className="mt-4 text-muted-foreground font-mono text-sm">Buscando vulnerabilidades...</p>
          </div>
        ) : vulnerabilities.length === 0 ? (
          <div className="text-center py-8">
            <div className="relative inline-block">
              <Bug className="w-12 h-12 text-neon-green mx-auto mb-3" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-neon-green rounded-full flex items-center justify-center">
                <span className="text-xs text-primary-foreground">✓</span>
              </div>
            </div>
            <p className="text-neon-green font-semibold">Sin vulnerabilidades detectadas</p>
            <p className="text-muted-foreground text-sm mt-1">Inicia un escaneo para analizar</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {sortedVulnerabilities.map((vuln) => {
              const config = getSeverityConfig(vuln.severity)
              return (
                <div key={vuln.id} className={cn("p-4 rounded-lg border transition-all", config.bg, config.border)}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={config.color}>{config.icon}</span>
                      <h4 className="font-semibold text-foreground">{vuln.title}</h4>
                    </div>
                    <Badge className={config.badge}>{config.label}</Badge>
                  </div>
                  {vuln.cve && (
                    <span className="inline-block text-xs font-mono bg-secondary px-2 py-1 rounded mb-2">
                      {vuln.cve}
                    </span>
                  )}
                  <p className="text-sm text-muted-foreground">{vuln.description}</p>
                  {vuln.solution && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-neon-green">
                        <span className="font-semibold">Solución:</span> {vuln.solution}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
