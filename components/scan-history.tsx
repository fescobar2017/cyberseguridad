"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, Trash2, Eye, Clock, AlertTriangle, CheckCircle2, Mail, Lock } from "lucide-react"
import { getScanHistory, deleteScanRecord, clearScanHistory, type ScanRecord } from "@/lib/scan-storage"
import { getCurrentSession } from "@/lib/auth-storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ScanHistoryProps {
  onLoadScan?: (record: ScanRecord) => void
  onRequestLogin: () => void
  onSendEmail: (records: ScanRecord[]) => void
  refreshTrigger?: number
}

export function ScanHistory({ onLoadScan, onRequestLogin, onSendEmail, refreshTrigger }: ScanHistoryProps) {
  const [history, setHistory] = useState<ScanRecord[]>([])
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const loadHistory = useCallback(() => {
    const session = getCurrentSession()
    setIsAuthenticated(!!session)
    if (session) {
      setHistory(getScanHistory())
    } else {
      setHistory([])
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory, refreshTrigger])

  const handleDelete = (id: string) => {
    deleteScanRecord(id)
    loadHistory()
  }

  const handleClearAll = () => {
    if (confirm("¿Estás seguro de eliminar todo el historial?")) {
      clearScanHistory()
      loadHistory()
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSeverityCount = (record: ScanRecord) => {
    const critical = record.vulnerabilities.filter((v) => v.severity === "critical").length
    const high = record.vulnerabilities.filter((v) => v.severity === "high").length
    const medium = record.vulnerabilities.filter((v) => v.severity === "medium").length
    return { critical, high, medium }
  }

  if (!isAuthenticated) {
    return (
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <History className="w-5 h-5 text-neon-green" />
            Historial de Escaneos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Lock className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-sm mb-4 text-center">Inicia sesión para ver y guardar tu historial</p>
            <Button
              onClick={onRequestLogin}
              variant="outline"
              className="border-neon-green text-neon-green hover:bg-neon-green/10 bg-transparent"
            >
              Iniciar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <History className="w-5 h-5 text-neon-green" />
            Historial de Escaneos
          </CardTitle>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSendEmail(history)}
                  className="text-neon-green hover:text-neon-green hover:bg-neon-green/10"
                >
                  <Mail className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-alert-red hover:text-alert-red hover:bg-alert-red/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <History className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-sm">No hay escaneos previos</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {history.map((record) => {
                const { critical, high, medium } = getSeverityCount(record)
                const openPorts = record.ports.filter((p) => p.status === "open").length

                return (
                  <div
                    key={record.id}
                    className="border border-border rounded-lg p-4 hover:border-neon-green/30 transition-colors bg-secondary/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-mono text-sm font-semibold text-foreground mb-1">{record.target}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(record.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedScan(record)}
                              className="h-8 w-8 p-0 text-neon-green hover:text-neon-green hover:bg-neon-green/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="font-mono">{selectedScan?.target}</DialogTitle>
                              <DialogDescription>
                                Escaneo realizado el {selectedScan && formatDate(selectedScan.timestamp)}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedScan && (
                              <div className="space-y-4 mt-4">
                                <div>
                                  <h4 className="font-semibold mb-2 text-sm">Puertos Abiertos</h4>
                                  <div className="space-y-1">
                                    {selectedScan.ports
                                      .filter((p) => p.status === "open")
                                      .map((port, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between text-xs p-2 bg-secondary rounded"
                                        >
                                          <span className="font-mono">
                                            {port.port} - {port.service}
                                          </span>
                                          <span className="text-muted-foreground">{port.version}</span>
                                        </div>
                                      ))}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-2 text-sm">Vulnerabilidades</h4>
                                  <div className="space-y-2">
                                    {selectedScan.vulnerabilities.map((vuln) => (
                                      <div
                                        key={vuln.id}
                                        className="p-3 bg-secondary rounded border-l-2 border-alert-red"
                                      >
                                        <div className="flex items-start justify-between mb-1">
                                          <span className="font-medium text-sm">{vuln.title}</span>
                                          <span
                                            className={`text-xs px-2 py-0.5 rounded ${
                                              vuln.severity === "critical"
                                                ? "bg-alert-red/20 text-alert-red"
                                                : vuln.severity === "high"
                                                  ? "bg-orange-500/20 text-orange-400"
                                                  : "bg-warning-yellow/20 text-warning-yellow"
                                            }`}
                                          >
                                            {vuln.severity.toUpperCase()}
                                          </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{vuln.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(record.id)}
                          className="h-8 w-8 p-0 text-alert-red hover:text-alert-red hover:bg-alert-red/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-neon-green">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{openPorts} puertos</span>
                      </div>
                      {critical > 0 && (
                        <div className="flex items-center gap-1.5 text-alert-red">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{critical} críticas</span>
                        </div>
                      )}
                      {high > 0 && (
                        <div className="flex items-center gap-1.5 text-orange-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{high} altas</span>
                        </div>
                      )}
                      {medium > 0 && (
                        <div className="flex items-center gap-1.5 text-warning-yellow">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{medium} medias</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
