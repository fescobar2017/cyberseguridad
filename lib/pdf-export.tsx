import type { PortResult } from "@/components/port-scanner"
import type { HeaderResult } from "@/components/http-headers"
import type { Vulnerability } from "@/components/vulnerabilities"

interface ReportData {
  target: string
  timestamp: number
  ports: PortResult[]
  headers: HeaderResult[]
  vulnerabilities: Vulnerability[]
  geoData?: {
    city: string
    country: string
    countryCode: string
    isp: string
  }
}

export function generatePDFReport(data: ReportData): void {
  const { target, timestamp, ports, headers, vulnerabilities, geoData } = data
  const date = new Date(timestamp).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const openPorts = ports.filter((p) => p.status === "open")
  const secureHeaders = headers.filter((h) => h.status === "secure")
  const missingHeaders = headers.filter((h) => h.status === "missing")
  const criticalVulns = vulnerabilities.filter((v) => v.severity === "critical")
  const highVulns = vulnerabilities.filter((v) => v.severity === "high")
  const mediumVulns = vulnerabilities.filter((v) => v.severity === "medium")
  const lowVulns = vulnerabilities.filter((v) => v.severity === "low")

  // Generate HTML content for printing
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Seguridad - ${target}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 40px; 
      color: #1a1a1a; 
      background: #fff; 
      line-height: 1.6;
    }
    .header { 
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); 
      color: #00ff88; 
      padding: 30px; 
      margin: -40px -40px 30px -40px; 
      border-bottom: 4px solid #00ff88; 
    }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header p { color: #888; font-size: 14px; }
    .meta-info { 
      display: flex; 
      gap: 40px; 
      margin: 20px 0; 
      padding: 20px; 
      background: #f8f9fa; 
      border-radius: 8px; 
    }
    .meta-item { }
    .meta-item label { font-size: 12px; color: #666; display: block; }
    .meta-item span { font-size: 16px; font-weight: 600; font-family: monospace; }
    .summary { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 16px; 
      margin: 30px 0; 
    }
    .summary-card { 
      padding: 20px; 
      border-radius: 8px; 
      text-align: center; 
    }
    .summary-card.ports { background: #e8f5e9; border: 2px solid #4caf50; }
    .summary-card.headers { background: #e3f2fd; border: 2px solid #2196f3; }
    .summary-card.vulns { background: #ffebee; border: 2px solid #f44336; }
    .summary-card.geo { background: #fff3e0; border: 2px solid #ff9800; }
    .summary-card .number { font-size: 32px; font-weight: 700; }
    .summary-card .label { font-size: 12px; color: #666; }
    section { margin: 30px 0; page-break-inside: avoid; }
    section h2 { 
      font-size: 18px; 
      padding-bottom: 10px; 
      margin-bottom: 15px; 
      border-bottom: 2px solid #e0e0e0; 
      color: #333;
    }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #f5f5f5; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .status-open { color: #f44336; font-weight: 600; }
    .status-closed { color: #4caf50; }
    .status-filtered { color: #ff9800; }
    .status-secure { color: #4caf50; }
    .status-missing { color: #f44336; }
    .status-warning { color: #ff9800; }
    .vuln-card { 
      background: #fff; 
      border: 1px solid #e0e0e0; 
      border-radius: 8px; 
      padding: 16px; 
      margin: 12px 0; 
    }
    .vuln-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .vuln-title { font-weight: 600; font-size: 14px; }
    .severity { 
      padding: 4px 12px; 
      border-radius: 20px; 
      font-size: 11px; 
      font-weight: 600; 
      text-transform: uppercase; 
    }
    .severity.critical { background: #f44336; color: white; }
    .severity.high { background: #ff5722; color: white; }
    .severity.medium { background: #ff9800; color: white; }
    .severity.low { background: #4caf50; color: white; }
    .vuln-description { font-size: 13px; color: #666; margin: 8px 0; }
    .vuln-solution { 
      background: #e8f5e9; 
      padding: 10px; 
      border-radius: 4px; 
      font-size: 12px; 
      margin-top: 10px; 
    }
    .vuln-solution strong { color: #2e7d32; }
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 2px solid #e0e0e0; 
      text-align: center; 
      font-size: 12px; 
      color: #888; 
    }
    @media print {
      body { padding: 20px; }
      .header { margin: -20px -20px 20px -20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>REPORTE DE ANÁLISIS DE SEGURIDAD</h1>
    <p>CyberScan Security Dashboard</p>
  </div>

  <div class="meta-info">
    <div class="meta-item">
      <label>Objetivo Escaneado</label>
      <span>${target}</span>
    </div>
    <div class="meta-item">
      <label>Fecha del Análisis</label>
      <span>${date}</span>
    </div>
    ${
      geoData
        ? `
    <div class="meta-item">
      <label>Ubicación</label>
      <span>${geoData.city}, ${geoData.country}</span>
    </div>
    <div class="meta-item">
      <label>ISP</label>
      <span>${geoData.isp}</span>
    </div>
    `
        : ""
    }
  </div>

  <div class="summary">
    <div class="summary-card ports">
      <div class="number">${openPorts.length}</div>
      <div class="label">Puertos Abiertos</div>
    </div>
    <div class="summary-card headers">
      <div class="number">${secureHeaders.length}/${headers.length}</div>
      <div class="label">Cabeceras Seguras</div>
    </div>
    <div class="summary-card vulns">
      <div class="number">${vulnerabilities.length}</div>
      <div class="label">Vulnerabilidades</div>
    </div>
    <div class="summary-card geo">
      <div class="number">${criticalVulns.length + highVulns.length}</div>
      <div class="label">Críticas/Altas</div>
    </div>
  </div>

  <section>
    <h2>Estado de Puertos (Nmap)</h2>
    <table>
      <thead>
        <tr>
          <th>Puerto</th>
          <th>Servicio</th>
          <th>Estado</th>
          <th>Versión</th>
        </tr>
      </thead>
      <tbody>
        ${ports
          .map(
            (port) => `
          <tr>
            <td><strong>${port.port}</strong></td>
            <td>${port.service}</td>
            <td class="status-${port.status}">${port.status.toUpperCase()}</td>
            <td>${port.version || "-"}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  </section>

  <section>
    <h2>Análisis de Cabeceras HTTP</h2>
    <table>
      <thead>
        <tr>
          <th>Cabecera</th>
          <th>Estado</th>
          <th>Valor</th>
          <th>Descripción</th>
        </tr>
      </thead>
      <tbody>
        ${headers
          .map(
            (header) => `
          <tr>
            <td><strong>${header.name}</strong></td>
            <td class="status-${header.status}">${header.status === "secure" ? "SEGURO" : header.status === "missing" ? "FALTANTE" : "ADVERTENCIA"}</td>
            <td style="font-family: monospace; font-size: 12px;">${header.value || "-"}</td>
            <td style="font-size: 12px;">${header.description}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  </section>

  <section>
    <h2>Vulnerabilidades Detectadas (${vulnerabilities.length})</h2>
    ${vulnerabilities
      .map(
        (vuln) => `
      <div class="vuln-card">
        <div class="vuln-header">
          <span class="vuln-title">${vuln.title}</span>
          <span class="severity ${vuln.severity}">${vuln.severity}</span>
        </div>
        ${vuln.cve ? `<div style="font-size: 11px; color: #888;">CVE: ${vuln.cve}</div>` : ""}
        <p class="vuln-description">${vuln.description}</p>
        <div class="vuln-solution">
          <strong>Solución recomendada:</strong> ${vuln.solution}
        </div>
      </div>
    `,
      )
      .join("")}
  </section>

  <div class="footer">
    <p>Reporte generado por CyberScan Security Dashboard</p>
    <p>Este reporte es para fines informativos. Consulte con un profesional de seguridad para remediar las vulnerabilidades.</p>
  </div>
</body>
</html>
  `

  // Open print dialog with the generated HTML
  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()

    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}
