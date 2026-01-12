"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Send, FileText, History } from "lucide-react"
import type { ScanRecord } from "@/lib/scan-storage"
import { openEmailClient, generateEmailBody, generateHistoryEmailBody } from "@/lib/email-utils"

interface EmailModalProps {
  open: boolean
  onClose: () => void
  currentScan: ScanRecord | null
  scanHistory: ScanRecord[]
}

export function EmailModal({ open, onClose, currentScan, scanHistory }: EmailModalProps) {
  const [email, setEmail] = useState("")
  const [sendType, setSendType] = useState<"current" | "history">("current")

  const handleSend = () => {
    if (!email) return

    let subject: string
    let body: string

    if (sendType === "current" && currentScan) {
      subject = `Reporte de Seguridad - ${currentScan.target}`
      body = generateEmailBody(currentScan)
    } else {
      subject = `Historial de Escaneos - CyberScan`
      body = generateHistoryEmailBody(scanHistory)
    }

    openEmailClient(email, subject, body)
    onClose()
    setEmail("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Mail className="w-5 h-5 text-neon-green" />
            Enviar por Email
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Se abrirá tu cliente de correo con el reporte listo para enviar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">¿Qué deseas enviar?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSendType("current")}
                disabled={!currentScan}
                className={`p-4 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                  sendType === "current"
                    ? "border-neon-green bg-neon-green/10 text-neon-green"
                    : "border-border bg-secondary text-muted-foreground hover:border-neon-green/50"
                } ${!currentScan ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <FileText className="w-6 h-6" />
                <span className="text-sm font-medium">Escaneo Actual</span>
              </button>
              <button
                type="button"
                onClick={() => setSendType("history")}
                disabled={scanHistory.length === 0}
                className={`p-4 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                  sendType === "history"
                    ? "border-neon-green bg-neon-green/10 text-neon-green"
                    : "border-border bg-secondary text-muted-foreground hover:border-neon-green/50"
                } ${scanHistory.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <History className="w-6 h-6" />
                <span className="text-sm font-medium">Historial</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient-email" className="text-sm text-muted-foreground">
              Email del destinatario
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="recipient-email"
                type="email"
                placeholder="destinatario@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-secondary border-border focus:border-neon-green focus:ring-neon-green/20"
              />
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={
              !email || (sendType === "current" && !currentScan) || (sendType === "history" && scanHistory.length === 0)
            }
            className="w-full bg-neon-green text-primary-foreground hover:bg-neon-green/90 transition-all hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]"
          >
            <Send className="w-4 h-4 mr-2" />
            Abrir Cliente de Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
