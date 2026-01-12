// API utilities for real security scanning

export interface GeoData {
  ip: string
  city: string
  region: string
  country: string
  countryCode: string
  timezone: string
  latitude: number
  longitude: number
  isp: string
  org: string
  asn: string
}

export interface PortResult {
  port: number
  service: string
  status: "open" | "closed" | "filtered"
  version?: string
}

export interface HeaderResult {
  name: string
  value: string
  status: "secure" | "warning" | "missing"
  description: string
}

export interface Vulnerability {
  id: string
  title: string
  severity: "critical" | "high" | "medium" | "low"
  description: string
  cve?: string
  solution: string
}

export interface NmapScanResult {
  success: boolean
  target: string
  scanType: string
  ports: PortResult[]
  raw?: string
  timestamp: string
  error?: string
  hint?: string
}

export async function fetchGeolocation(target: string): Promise<GeoData | null> {
  try {
    const cleanTarget = target.replace(/^https?:\/\//, "").split("/")[0]

    const response = await fetch(
      `http://ip-api.com/json/${cleanTarget}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
    )

    if (!response.ok) throw new Error("Failed to fetch geolocation")

    const data = await response.json()

    if (data.status === "fail") {
      return {
        ip: cleanTarget,
        city: "Unknown",
        region: "Unknown",
        country: "Unknown",
        countryCode: "XX",
        timezone: "UTC",
        latitude: 0,
        longitude: 0,
        isp: "Unknown",
        org: "Unknown",
        asn: "Unknown",
      }
    }

    return {
      ip: data.query || cleanTarget,
      city: data.city || "Unknown",
      region: data.regionName || "Unknown",
      country: data.country || "Unknown",
      countryCode: data.countryCode || "XX",
      timezone: data.timezone || "UTC",
      latitude: data.lat || 0,
      longitude: data.lon || 0,
      isp: data.isp || "Unknown",
      org: data.org || "Unknown",
      asn: data.as || "Unknown",
    }
  } catch (error) {
    console.error("[v0] Geolocation fetch error:", error)
    return null
  }
}

export async function fetchHttpHeaders(target: string): Promise<HeaderResult[]> {
  try {
    const response = await fetch(`/api/scan-headers?target=${encodeURIComponent(target)}`)

    if (!response.ok) throw new Error("Failed to fetch headers")

    const data = await response.json()
    return data.headers
  } catch (error) {
    console.error("[v0] Headers fetch error:", error)
    return []
  }
}

export async function scanPorts(
  target: string,
  scanType: "quick" | "common" | "full" | "stealth" = "quick",
): Promise<PortResult[]> {
  try {
    const response = await fetch(`/api/nmap-scan?target=${encodeURIComponent(target)}&type=${scanType}`)

    const data: NmapScanResult = await response.json()

    if (!response.ok || data.error) {
      console.error("[v0] Nmap scan error:", data.error, data.hint)
      // Return empty array on error, let UI show the error state
      return []
    }

    return data.ports
  } catch (error) {
    console.error("[v0] Port scan error:", error)
    return []
  }
}

export function analyzeVulnerabilities(headers: HeaderResult[], ports: PortResult[]): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = []
  let vulnId = 1

  const missingHeaders = headers.filter((h) => h.status === "missing")

  if (missingHeaders.some((h) => h.name === "Strict-Transport-Security")) {
    vulnerabilities.push({
      id: String(vulnId++),
      title: "Falta cabecera HSTS",
      severity: "medium",
      description: "El sitio no implementa HTTP Strict Transport Security, permitiendo ataques de downgrade a HTTP.",
      solution: "Configurar cabecera Strict-Transport-Security con max-age mínimo de 31536000",
    })
  }

  if (missingHeaders.some((h) => h.name === "Content-Security-Policy")) {
    vulnerabilities.push({
      id: String(vulnId++),
      title: "Sin política de seguridad de contenido",
      severity: "high",
      description: "No hay CSP configurada, lo que permite ataques XSS e inyección de scripts maliciosos.",
      cve: "CWE-79",
      solution: "Implementar Content-Security-Policy restrictiva",
    })
  }

  if (missingHeaders.some((h) => h.name === "X-Frame-Options")) {
    vulnerabilities.push({
      id: String(vulnId++),
      title: "Vulnerable a Clickjacking",
      severity: "medium",
      description: "Sin X-Frame-Options, el sitio puede ser embebido en iframes maliciosos.",
      cve: "CWE-1021",
      solution: "Agregar X-Frame-Options: DENY o SAMEORIGIN",
    })
  }

  const openPorts = ports.filter((p) => p.status === "open")

  if (openPorts.some((p) => p.port === 21)) {
    vulnerabilities.push({
      id: String(vulnId++),
      title: "Puerto FTP abierto",
      severity: "high",
      description: "FTP transmite credenciales en texto plano y es vulnerable a ataques.",
      cve: "CWE-319",
      solution: "Usar SFTP o desactivar FTP completamente",
    })
  }

  if (openPorts.some((p) => p.port === 23)) {
    vulnerabilities.push({
      id: String(vulnId++),
      title: "Telnet expuesto",
      severity: "critical",
      description: "Telnet no cifra las comunicaciones, exponiendo credenciales y datos.",
      cve: "CWE-319",
      solution: "Desactivar Telnet y usar SSH exclusivamente",
    })
  }

  if (openPorts.some((p) => p.port === 22)) {
    vulnerabilities.push({
      id: String(vulnId++),
      title: "SSH expuesto a Internet",
      severity: "medium",
      description: "SSH accesible públicamente puede ser objetivo de ataques de fuerza bruta.",
      solution: "Usar autenticación por llaves, fail2ban, y considerar port knocking",
    })
  }

  if (openPorts.some((p) => [3306, 5432, 27017, 6379].includes(p.port))) {
    vulnerabilities.push({
      id: String(vulnId++),
      title: "Base de datos expuesta",
      severity: "critical",
      description: "Puerto de base de datos accesible públicamente representa un riesgo crítico.",
      cve: "CWE-284",
      solution: "Bloquear acceso externo a puertos de base de datos",
    })
  }

  if (openPorts.some((p) => p.port === 3389)) {
    vulnerabilities.push({
      id: String(vulnId++),
      title: "RDP expuesto a Internet",
      severity: "critical",
      description: "Remote Desktop Protocol expuesto es objetivo frecuente de ransomware.",
      cve: "CVE-2019-0708",
      solution: "Usar VPN para acceso RDP, no exponerlo directamente",
    })
  }

  if (openPorts.some((p) => p.port === 445)) {
    vulnerabilities.push({
      id: String(vulnId++),
      title: "SMB expuesto",
      severity: "critical",
      description: "SMB expuesto puede permitir ataques como EternalBlue/WannaCry.",
      cve: "CVE-2017-0144",
      solution: "Bloquear puerto 445 externamente, usar solo en red local",
    })
  }

  if (ports.some((p) => p.version)) {
    vulnerabilities.push({
      id: String(vulnId++),
      title: "Información de versión expuesta",
      severity: "low",
      description: "Los servicios revelan información de versión que puede ayudar a atacantes.",
      solution: "Ocultar banners de versión en la configuración de servicios",
    })
  }

  return vulnerabilities
}
