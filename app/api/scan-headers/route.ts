import { type NextRequest, NextResponse } from "next/server"

interface HeaderCheck {
  name: string
  description: string
  secureCheck: (value: string | null) => "secure" | "warning" | "missing"
}

const securityHeaders: HeaderCheck[] = [
  {
    name: "Strict-Transport-Security",
    description: "Fuerza conexiones HTTPS",
    secureCheck: (value) => {
      if (!value) return "missing"
      if (value.includes("max-age=") && Number.parseInt(value.match(/max-age=(\d+)/)?.[1] || "0") >= 31536000) {
        return "secure"
      }
      return "warning"
    },
  },
  {
    name: "Content-Security-Policy",
    description: "Previene XSS e inyección de contenido",
    secureCheck: (value) => {
      if (!value) return "missing"
      if (value.includes("default-src") || value.includes("script-src")) return "secure"
      return "warning"
    },
  },
  {
    name: "X-Frame-Options",
    description: "Previene ataques de clickjacking",
    secureCheck: (value) => {
      if (!value) return "missing"
      if (value === "DENY" || value === "SAMEORIGIN") return "secure"
      return "warning"
    },
  },
  {
    name: "X-Content-Type-Options",
    description: "Previene MIME type sniffing",
    secureCheck: (value) => {
      if (!value) return "missing"
      if (value === "nosniff") return "secure"
      return "warning"
    },
  },
  {
    name: "X-XSS-Protection",
    description: "Filtro XSS del navegador (legacy)",
    secureCheck: (value) => {
      if (!value) return "missing"
      if (value === "0") return "warning" // Disabled
      if (value.includes("1")) return "secure"
      return "warning"
    },
  },
  {
    name: "Referrer-Policy",
    description: "Controla información de referrer",
    secureCheck: (value) => {
      if (!value) return "missing"
      if (["no-referrer", "strict-origin-when-cross-origin", "same-origin"].includes(value)) {
        return "secure"
      }
      return "warning"
    },
  },
  {
    name: "Permissions-Policy",
    description: "Controla acceso a APIs del navegador",
    secureCheck: (value) => {
      if (!value) return "missing"
      return "secure"
    },
  },
  {
    name: "X-Permitted-Cross-Domain-Policies",
    description: "Controla políticas cross-domain de Adobe",
    secureCheck: (value) => {
      if (!value) return "missing"
      if (value === "none") return "secure"
      return "warning"
    },
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const target = searchParams.get("target")

  if (!target) {
    return NextResponse.json({ error: "Target is required" }, { status: 400 })
  }

  try {
    // Normalize the target URL
    let url = target
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`
    }

    // Fetch headers from the target
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    })

    clearTimeout(timeoutId)

    const headers = securityHeaders.map((check) => {
      const value = response.headers.get(check.name)
      const status = check.secureCheck(value)

      return {
        name: check.name,
        value: value || "",
        status,
        description: check.description,
      }
    })

    return NextResponse.json({ headers, status: response.status })
  } catch (error) {
    console.log("[v0] Error fetching headers:", error)

    // Return simulated headers on error
    const simulatedHeaders = securityHeaders.map((check) => ({
      name: check.name,
      value: "",
      status: "missing" as const,
      description: check.description,
    }))

    return NextResponse.json({
      headers: simulatedHeaders,
      error: "Could not reach target, showing default analysis",
    })
  }
}
