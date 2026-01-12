import type { ScanRecord } from "@/lib/scan-storage"

export function generateEmailBody(record: ScanRecord): string {
  const date = new Date(record.timestamp).toLocaleString("es-ES")

  const openPorts = record.ports.filter((p) => p.status === "open")
  const portsText = openPorts
    .map((p) => `  - Puerto ${p.port} (${p.service})${p.version ? ` - ${p.version}` : ""}`)
    .join("\n")

  const vulnsText = record.vulnerabilities
    .map((v) => `  - [${v.severity.toUpperCase()}] ${v.title}${v.cve ? ` (${v.cve})` : ""}`)
    .join("\n")

  const secureHeaders = record.headers.filter((h) => h.status === "secure").length
  const missingHeaders = record.headers.filter((h) => h.status === "missing").length

  return `
═══════════════════════════════════════════
       REPORTE DE SEGURIDAD - CYBERSCAN
═══════════════════════════════════════════

Objetivo: ${record.target}
Fecha: ${date}
${
  record.geoData
    ? `Ubicación: ${record.geoData.city}, ${record.geoData.country}
ISP: ${record.geoData.isp}`
    : ""
}

───────────────────────────────────────────
PUERTOS ABIERTOS (${openPorts.length})
───────────────────────────────────────────
${portsText || "  Ninguno detectado"}

───────────────────────────────────────────
CABECERAS HTTP
───────────────────────────────────────────
  ✓ Seguras: ${secureHeaders}
  ✗ Faltantes: ${missingHeaders}

───────────────────────────────────────────
VULNERABILIDADES (${record.vulnerabilities.length})
───────────────────────────────────────────
${vulnsText || "  Ninguna detectada"}

═══════════════════════════════════════════
Generado por CyberScan Dashboard
═══════════════════════════════════════════
`.trim()
}

export function openEmailClient(to: string, subject: string, body: string): void {
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailtoUrl, "_blank")
}

export function generateHistoryEmailBody(records: ScanRecord[]): string {
  const date = new Date().toLocaleString("es-ES")

  const recordsText = records
    .slice(0, 10)
    .map((record, idx) => {
      const scanDate = new Date(record.timestamp).toLocaleString("es-ES")
      const critical = record.vulnerabilities.filter((v) => v.severity === "critical").length
      const high = record.vulnerabilities.filter((v) => v.severity === "high").length
      const openPorts = record.ports.filter((p) => p.status === "open").length

      return `
${idx + 1}. ${record.target}
   Fecha: ${scanDate}
   Puertos abiertos: ${openPorts}
   Vulnerabilidades: ${critical} críticas, ${high} altas
`
    })
    .join("\n")

  return `
═══════════════════════════════════════════
    HISTORIAL DE ESCANEOS - CYBERSCAN
═══════════════════════════════════════════

Fecha del reporte: ${date}
Total de escaneos: ${records.length}

───────────────────────────────────────────
ÚLTIMOS ESCANEOS
───────────────────────────────────────────
${recordsText}

═══════════════════════════════════════════
Generado por CyberScan Dashboard
═══════════════════════════════════════════
`.trim()
}
