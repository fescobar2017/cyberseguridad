"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Network, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PortResult {
  port: number
  service: string
  status: "open" | "closed" | "filtered"
  version?: string
}

interface PortScannerProps {
  ports: PortResult[]
  isScanning: boolean
}

export function PortScanner({ ports, isScanning }: PortScannerProps) {
  const getStatusColor = (status: PortResult["status"]) => {
    switch (status) {
      case "open":
        return "text-neon-green"
      case "closed":
        return "text-neon-red"
      case "filtered":
        return "text-neon-yellow"
    }
  }

  const getStatusBg = (status: PortResult["status"]) => {
    switch (status) {
      case "open":
        return "bg-neon-green/10 border-neon-green/30"
      case "closed":
        return "bg-neon-red/10 border-neon-red/30"
      case "filtered":
        return "bg-neon-yellow/10 border-neon-yellow/30"
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <div className="p-2 bg-neon-green/10 rounded-lg">
            <Network className="w-5 h-5 text-neon-green" />
          </div>
          Estado de Puertos (Nmap)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isScanning ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-2 border-neon-green/30 rounded-full animate-ping" />
              <div className="absolute inset-2 border-2 border-neon-green/50 rounded-full animate-pulse" />
              <div className="absolute inset-4 bg-neon-green/20 rounded-full animate-pulse" />
            </div>
            <p className="mt-4 text-muted-foreground font-mono text-sm">Escaneando puertos...</p>
          </div>
        ) : ports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Network className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Inicia un escaneo para ver los puertos</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {ports.map((port) => (
              <div
                key={port.port}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all",
                  getStatusBg(port.status),
                )}
              >
                <div className="flex items-center gap-3">
                  <Circle className={cn("w-3 h-3 fill-current", getStatusColor(port.status))} />
                  <div>
                    <span className="font-mono font-semibold text-foreground">{port.port}</span>
                    <span className="text-muted-foreground mx-2">/</span>
                    <span className="text-muted-foreground">{port.service}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {port.version && (
                    <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {port.version}
                    </span>
                  )}
                  <span className={cn("text-sm font-medium uppercase", getStatusColor(port.status))}>
                    {port.status === "open" ? "Abierto" : port.status === "closed" ? "Cerrado" : "Filtrado"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
