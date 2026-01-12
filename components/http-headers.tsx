"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileCode, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface HeaderResult {
  name: string
  value: string
  status: "secure" | "warning" | "missing"
  description: string
}

interface HttpHeadersProps {
  headers: HeaderResult[]
  isScanning: boolean
}

export function HttpHeaders({ headers, isScanning }: HttpHeadersProps) {
  const getStatusIcon = (status: HeaderResult["status"]) => {
    switch (status) {
      case "secure":
        return <CheckCircle className="w-4 h-4 text-neon-green" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-neon-yellow" />
      case "missing":
        return <XCircle className="w-4 h-4 text-neon-red" />
    }
  }

  const getStatusBorder = (status: HeaderResult["status"]) => {
    switch (status) {
      case "secure":
        return "border-l-neon-green"
      case "warning":
        return "border-l-neon-yellow"
      case "missing":
        return "border-l-neon-red"
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="p-2 bg-neon-green/10 rounded-lg">
            <FileCode className="w-5 h-5 text-neon-green" />
          </div>
          Análisis de Cabeceras HTTP
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isScanning ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-8 bg-neon-green/50 rounded animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <p className="mt-4 text-muted-foreground font-mono text-sm">Analizando cabeceras...</p>
          </div>
        ) : headers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Inicia un escaneo para ver las cabeceras</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {headers.map((header, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 bg-secondary/50 rounded-lg border-l-4 transition-all",
                  getStatusBorder(header.status),
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(header.status)}
                      <span className="font-mono font-semibold text-foreground text-sm">{header.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-mono">{header.value || "No presente"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{header.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
