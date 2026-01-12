"use client"

import { useState, useEffect, useCallback } from "react"
import { ScanInput } from "@/components/scan-input"
import { PortScanner, type PortResult } from "@/components/port-scanner"
import { HttpHeaders, type HeaderResult } from "@/components/http-headers"
import { Vulnerabilities, type Vulnerability } from "@/components/vulnerabilities"
import { StatsBar } from "@/components/stats-bar"
import { GeolocationMap } from "@/components/geolocation-map"
import { ScanHistory } from "@/components/scan-history"
import { AuthModal } from "@/components/auth-modal"
import { EmailModal } from "@/components/email-modal"
import { Shield, Terminal, FileDown, Mail, User, LogOut } from "lucide-react"
import { saveScanRecord, getScanHistory, type ScanRecord } from "@/lib/scan-storage"
import { generatePDFReport } from "@/lib/pdf-export"
import { getCurrentSession, logoutUser, type AuthSession } from "@/lib/auth-storage"
import { scanPorts, fetchHttpHeaders, analyzeVulnerabilities, type GeoData } from "@/lib/security-api"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function CyberDashboard() {
  const [isScanning, setIsScanning] = useState(false)
  const [currentTarget, setCurrentTarget] = useState<string | null>(null)
  const [ports, setPorts] = useState<PortResult[]>([])
  const [headers, setHeaders] = useState<HeaderResult[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const [geoData, setGeoData] = useState<GeoData | null>(null)
  const [scanProgress, setScanProgress] = useState<string>("")
  const [scanError, setScanError] = useState<string | null>(null)

  const [session, setSession] = useState<AuthSession | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [currentScanRecord, setCurrentScanRecord] = useState<ScanRecord | null>(null)
  const [historyRefresh, setHistoryRefresh] = useState(0)

  useEffect(() => {
    setSession(getCurrentSession())
  }, [])

  const handleLogout = () => {
    logoutUser()
    setSession(null)
    setHistoryRefresh((prev) => prev + 1)
  }

  const handleAuthSuccess = () => {
    setSession(getCurrentSession())
    setHistoryRefresh((prev) => prev + 1)
  }

  const handleGeoDataLoaded = useCallback((data: GeoData) => {
    setGeoData(data)
  }, [])

  const handleScan = async (target: string, scanType: "quick" | "common" | "full" | "stealth" = "quick") => {
    setIsScanning(true)
    setCurrentTarget(target)
    setPorts([])
    setHeaders([])
    setVulnerabilities([])
    setGeoData(null)
    setScanError(null)

    try {
      setScanProgress(`Ejecutando Nmap (${scanType})...`)
      const portResults = await scanPorts(target, scanType)

      if (portResults.length === 0) {
        setScanError("Nmap no encontró puertos o no está instalado en el servidor")
      }

      setPorts(portResults)

      setScanProgress("Analizando cabeceras HTTP...")
      const headerResults = await fetchHttpHeaders(target)
      setHeaders(headerResults)

      setScanProgress("Detectando vulnerabilidades...")
      await new Promise((resolve) => setTimeout(resolve, 500))
      const vulnResults = analyzeVulnerabilities(headerResults, portResults)
      setVulnerabilities(vulnResults)

      setScanProgress("Escaneo completado")
    } catch (error) {
      console.error("[v0] Scan error:", error)
      setScanProgress("Error durante el escaneo")
      setScanError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setIsScanning(false)
    }
  }

  useEffect(() => {
    if (currentTarget && !isScanning && ports.length > 0 && geoData) {
      const savedRecord = saveScanRecord({
        target: currentTarget,
        ports,
        headers,
        vulnerabilities,
        geoData: {
          city: geoData.city,
          country: geoData.country,
          countryCode: geoData.countryCode,
          isp: geoData.isp,
        },
      })

      if (savedRecord) {
        setCurrentScanRecord(savedRecord)
        setHistoryRefresh((prev) => prev + 1)
      }
    }
  }, [currentTarget, isScanning, ports, headers, vulnerabilities, geoData])

  const handleExportPDF = () => {
    if (!currentTarget) return

    generatePDFReport({
      target: currentTarget,
      timestamp: Date.now(),
      ports,
      headers,
      vulnerabilities,
      geoData: geoData
        ? {
            city: geoData.city,
            country: geoData.country,
            countryCode: geoData.countryCode,
            isp: geoData.isp,
          }
        : undefined,
    })
  }

  const handleOpenEmailModal = () => {
    if (!session) {
      setShowAuthModal(true)
      return
    }
    setShowEmailModal(true)
  }

  const openPorts = ports.filter((p) => p.status === "open").length
  const secureHeaders = headers.filter((h) => h.status === "secure").length

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Shield className="w-8 h-8 text-neon-green" />
                <div className="absolute inset-0 bg-neon-green/20 blur-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Escaneo APP INTEGRATIVA SERVIDORES</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Terminal className="w-3 h-3" />
                  BY Francisco Escobar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isScanning && scanProgress && (
                <span className="text-sm text-neon-green animate-pulse font-mono">{scanProgress}</span>
              )}

              {currentTarget && !isScanning && (
                <>
                  <Button
                    onClick={handleOpenEmailModal}
                    variant="outline"
                    className="border-neon-green text-neon-green hover:bg-neon-green/10 bg-transparent"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email
                  </Button>
                  <Button
                    onClick={handleExportPDF}
                    className="bg-neon-green text-primary-foreground hover:bg-neon-green/90 transition-all hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                </>
              )}

              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-foreground hover:bg-secondary">
                      <User className="w-4 h-4 mr-2" />
                      {session.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem className="text-muted-foreground">{session.email}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-alert-red focus:text-alert-red">
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  variant="outline"
                  className="border-border text-foreground hover:border-neon-green hover:text-neon-green"
                >
                  <User className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <ScanInput onScan={handleScan} isScanning={isScanning} />
        </div>

        {scanError && (
          <div className="mb-6 p-4 bg-alert-red/10 border border-alert-red/30 rounded-lg">
            <p className="text-alert-red text-sm font-mono">⚠️ {scanError}</p>
            <p className="text-muted-foreground text-xs mt-1">
              Asegúrate de que Nmap esté instalado:{" "}
              <code className="bg-secondary px-1 rounded">sudo apt install nmap</code>
            </p>
          </div>
        )}

        <StatsBar
          target={currentTarget}
          portsOpen={openPorts}
          portsTotal={ports.length}
          headersSecure={secureHeaders}
          headersTotal={headers.length}
          vulnCount={vulnerabilities.length}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            <PortScanner ports={ports} isScanning={isScanning} />
            <HttpHeaders headers={headers} isScanning={isScanning} />
          </div>
          <div className="space-y-6">
            <GeolocationMap target={currentTarget} isScanning={isScanning} onGeoDataLoaded={handleGeoDataLoaded} />
            <ScanHistory
              onRequestLogin={() => setShowAuthModal(true)}
              onSendEmail={() => setShowEmailModal(true)}
              refreshTrigger={historyRefresh}
            />
          </div>
        </div>

        <Vulnerabilities vulnerabilities={vulnerabilities} isScanning={isScanning} />

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          <p>CyberScan Dashboard • Escaneo Nmap real • Cabeceras HTTP reales • Geolocalización real</p>
        </footer>
      </main>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />

      <EmailModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        currentScan={currentScanRecord}
        scanHistory={getScanHistory()}
      />
    </div>
  )
}
